import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventBus } from '@nestjs/cqrs';
import { MessageCreatedEvent } from '../application/events/message-created.event';
import { MediaMessageCreatedEvent } from '../application/events/media-message-created.event';
import { MessageReadEvent } from '../application/events/message-read.event';
import { WsJwtGuard } from '../../../core/guards/ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

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

  private readonly logger = new Logger(ChatsGateway.name);
  private readonly userSockets = new Map<number, string[]>(); // userId -> socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBus,
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

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;

      // Store socket connection
      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, []);
      }
      this.userSockets.get(client.userId).push(client.id);

      this.logger.log(
        `User ${client.userId} connected with socket ${client.id}`,
      );

      // Join user to their personal room for direct messages
      client.join(`user:${client.userId}`);

      // Notify user about successful connection
      client.emit('connection:established', { userId: client.userId });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId);
      if (sockets) {
        const index = sockets.indexOf(client.id);
        if (index > -1) {
          sockets.splice(index, 1);
        }
        if (sockets.length === 0) {
          this.userSockets.delete(client.userId);
        }
      }
      this.logger.log(`User ${client.userId} disconnected`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join:chat')
  handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: number },
  ) {
    const { chatId } = data;
    client.join(`chat:${chatId}`);
    this.logger.log(`User ${client.userId} joined chat ${chatId}`);
    return { success: true, chatId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave:chat')
  handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: number },
  ) {
    const { chatId } = data;
    client.leave(`chat:${chatId}`);
    this.logger.log(`User ${client.userId} left chat ${chatId}`);
    return { success: true, chatId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: number },
  ) {
    const { chatId } = data;
    // Notify other participants in the chat
    client.to(`chat:${chatId}`).emit('user:typing', {
      userId: client.userId,
      chatId,
      isTyping: true,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: number },
  ) {
    const { chatId } = data;
    // Notify other participants in the chat
    client.to(`chat:${chatId}`).emit('user:typing', {
      userId: client.userId,
      chatId,
      isTyping: false,
    });
  }

  private handleMessageCreated(event: MessageCreatedEvent) {
    const { chatId, messageId, senderId, content, createdAt } = event;

    // Emit to all participants in the chat room
    this.server.to(`chat:${chatId}`).emit('message:created', {
      messageId,
      chatId,
      senderId,
      content,
      createdAt,
    });

    // Also emit to sender's personal room (for confirmation)
    this.server.to(`user:${senderId}`).emit('message:sent', {
      messageId,
      chatId,
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

    // Emit to all participants in the chat room
    this.server.to(`chat:${chatId}`).emit('message:created', {
      messageId,
      chatId,
      senderId,
      type,
      content,
      attachment,
      createdAt,
    });

    // Also emit to sender's personal room (for confirmation)
    this.server.to(`user:${senderId}`).emit('message:sent', {
      messageId,
      chatId,
      type,
      content,
      attachment,
      createdAt,
    });

    // Emit to recipient's personal room if they're not in the chat room
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
    const { messageId, readerId, readAt } = event;

    // Notify all participants in relevant chats about read status
    // This would need additional logic to determine which chat the message belongs to
    // For now, we'll emit a generic event
    this.server.emit('message:read', {
      messageId,
      readerId,
      readAt,
    });

    this.logger.log(`Message ${messageId} read by user ${readerId}`);
  }

  private extractTokenFromSocket(client: Socket): string | null {
    // Try to get token from handshake auth
    const auth = client.handshake.auth;
    if (auth && auth.token) {
      return auth.token;
    }

    // Try to get token from query parameters
    const query = client.handshake.query;
    if (query && query.token) {
      return Array.isArray(query.token) ? query.token[0] : query.token;
    }

    return null;
  }

  // Helper method to get all sockets for a user
  getUserSockets(userId: number): string[] {
    return this.userSockets.get(userId) || [];
  }

  // Helper method to check if user is online
  isUserOnline(userId: number): boolean {
    return (
      this.userSockets.has(userId) && this.userSockets.get(userId).length > 0
    );
  }
}
