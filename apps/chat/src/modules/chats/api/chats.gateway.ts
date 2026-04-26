import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { MessageCreatedEvent } from '../application/events/message-created.event';
import { MediaMessageCreatedEvent } from '../application/events/media-message-created.event';
import { MessageReadEvent } from '../application/events/message-read.event';
import { WsJwtGuard } from '../../../core/guards/ws-jwt.guard';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import { LumioAuthHttpAdapter } from '@chat/core/adapters/lumio-auth-http.adapter';
import { AuthenticatedSocket } from '@chat/modules/chats/api/types/authenticated-socket.type';
import { AppLoggerService } from '@libs/logger/logger.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly userSockets = new Map<number, string[]>();

  constructor(
    private readonly eventBus: EventBus,
    private readonly chatRepository: ChatRepository,
    private readonly lumioAuthHttpAdapter: LumioAuthHttpAdapter,
    private readonly logger: AppLoggerService,
  ) {
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    this.eventBus.subscribe((event) => {
      if (event instanceof MessageCreatedEvent) {
        this.handleMessageCreated(event);
      }
      if (event instanceof MediaMessageCreatedEvent) {
        this.handleMediaMessageCreated(event);
      }
      if (event instanceof MessageReadEvent) {
        this.handleMessageRead(event);
      }
    });
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const { userId } =
        await this.lumioAuthHttpAdapter.validateAccessToken(token);
      client.data.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(client.id);

      this.logger.log(`User ${userId} connected with socket ${client.id}`);
      client.join(`user:${userId}`);
      client.emit('connection:established', { userId });
    } catch (error) {
      this.logger.error(
        `Connection error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        ChatsGateway.name,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.userId;
    if (!userId) {
      return;
    }

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      const index = sockets.indexOf(client.id);
      if (index > -1) {
        sockets.splice(index, 1);
      }
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.logger.log(`User ${userId} disconnected`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join:chat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: number },
  ) {
    const { chatId } = data;
    await this.ensureChatMembership(chatId, client);
    client.join(`chat:${chatId}`);
    this.logger.log(`User ${client.data.userId} joined chat ${chatId}`);
    return { success: true, chatId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave:chat')
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: number },
  ) {
    const { chatId } = data;
    await this.ensureChatMembership(chatId, client);
    client.leave(`chat:${chatId}`);
    this.logger.log(`User ${client.data.userId} left chat ${chatId}`);
    return { success: true, chatId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: number },
  ) {
    const { chatId } = data;
    await this.ensureChatMembership(chatId, client);
    client.to(`chat:${chatId}`).emit('user:typing', {
      userId: client.data.userId,
      chatId,
      isTyping: true,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: number },
  ) {
    const { chatId } = data;
    await this.ensureChatMembership(chatId, client);
    client.to(`chat:${chatId}`).emit('user:typing', {
      userId: client.data.userId,
      chatId,
      isTyping: false,
    });
  }

  private handleMessageCreated(event: MessageCreatedEvent) {
    const { chatId, messageId, senderId, recipientId, content, createdAt } =
      event;

    this.server.to(`chat:${chatId}`).emit('message:created', {
      messageId,
      chatId,
      senderId,
      content,
      createdAt,
    });

    this.server.to(`user:${senderId}`).emit('message:sent', {
      messageId,
      chatId,
      content,
      createdAt,
    });

    this.server.to(`user:${recipientId}`).emit('message:received', {
      messageId,
      chatId,
      senderId,
      content,
      createdAt,
    });

    this.logger.log(`Message ${messageId} created in chat ${chatId}`);
  }

  private handleMediaMessageCreated(event: MediaMessageCreatedEvent) {
    const {
      chatId,
      messageId,
      senderId,
      recipientId,
      type,
      content,
      attachment,
      createdAt,
    } = event;

    this.server.to(`chat:${chatId}`).emit('message:created', {
      messageId,
      chatId,
      senderId,
      type,
      content,
      attachment,
      createdAt,
    });

    this.server.to(`user:${senderId}`).emit('message:sent', {
      messageId,
      chatId,
      type,
      content,
      attachment,
      createdAt,
    });

    this.server.to(`user:${recipientId}`).emit('message:received', {
      messageId,
      chatId,
      senderId,
      type,
      content,
      attachment,
      createdAt,
    });

    this.logger.log(`Media message ${messageId} created in chat ${chatId}`);
  }

  private handleMessageRead(event: MessageReadEvent) {
    const { messageId, chatId, readerId, senderId, readAt } = event;

    this.server.to(`chat:${chatId}`).emit('message:read', {
      messageId,
      chatId,
      readerId,
      readAt,
    });
    this.server.to(`user:${senderId}`).emit('message:read', {
      messageId,
      chatId,
      readerId,
      readAt,
    });

    this.logger.log(
      `Message ${messageId} in chat ${chatId} read by user ${readerId}`,
    );
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const auth = client.handshake.auth;
    if (auth && auth.token) {
      return auth.token;
    }

    const query = client.handshake.query;
    if (query && query.token) {
      return Array.isArray(query.token) ? query.token[0] : query.token;
    }

    const authorization = client.handshake.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      return authorization.slice('Bearer '.length);
    }

    return null;
  }

  private async ensureChatMembership(
    chatId: number,
    client: AuthenticatedSocket,
  ): Promise<void> {
    const userId = client.data?.userId;
    if (!userId) {
      throw new WsException('Unauthorized: Socket is not authenticated');
    }

    const isParticipant = await this.chatRepository.isUserInChat(
      chatId,
      userId,
    );
    if (!isParticipant) {
      throw new WsException(
        'Forbidden: User is not a participant of this chat',
      );
    }
  }

  getUserSockets(userId: number): string[] {
    return this.userSockets.get(userId) || [];
  }

  isUserOnline(userId: number): boolean {
    return (
      this.userSockets.has(userId) && this.userSockets.get(userId)!.length > 0
    );
  }
}
