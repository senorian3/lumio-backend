import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateNotificationDto } from '@lumio/modules/notifications/api/dto/transfer/create-notifications.transfer.dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreateNotificationCommand } from '@lumio/modules/notifications/application/commands/create-notification.command-handler';
import { AppLoggerService } from '@libs/logger/logger.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  },
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: AppLoggerService,
  ) {}

  @WebSocketServer()
  server: Server;
  private userSockets: Map<number, Set<string>> = new Map();

  handleConnection(client: Socket) {
    const userIdRaw = client.handshake.query?.userId as string;
    const userId = Number(userIdRaw);
    if (!userId || isNaN(userId)) {
      this.forceDisconnect(client, 'Unauthorized: Missing userId');
      return;
    }
    client.join(`user_${userId}`);
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    this.emitUnreadCount(client);
  }

  handleDisconnect(client: Socket) {
    const userIdRaw = client.handshake.query?.userId;
    const userId = Number(userIdRaw);
    if (userId && !isNaN(userId)) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
  }

  async sendNotification(notification: CreateNotificationDto) {
    await this.commandBus
      .execute<
        CreateNotificationCommand,
        void
      >(new CreateNotificationCommand(notification))
      .catch((error) => {
        this.logger.error(
          `Failed to create notification: ${error.message}, userId: ${notification.userId}, type: ${notification.type}`,
          error.stack,
          NotificationsGateway.name,
        );
      });

    this.server.to(`user_${notification.userId}`).emit('notification:new', {
      title: notification.title,
      message: notification.message,
    });

    this.server.to(`user_${notification.userId}`).emit('notification:count', {
      count: 1,
    });
  }

  async emitUnreadCount(client: Socket) {
    client.emit('notification:count', { count: 0 });
  }

  @SubscribeMessage('notification:read_all')
  async handleReadAll(@ConnectedSocket() client: Socket) {
    const userIdRaw = client.handshake.query?.userId;
    const userId = Number(userIdRaw);
    if (!userId || isNaN(userId)) return;

    this.server.to(`user_${userId}`).emit('notification:count', { count: 0 });
  }

  //Переделать под БД

  // @SubscribeMessage('notification:history')
  // async handleHistory(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() payload: { page: number; limit: number },
  // ) {
  //   const userIdRaw =
  //     client.handshake.auth?.userId || client.handshake.query?.userId;
  //   const userId = Number(userIdRaw);
  //   if (!userId || isNaN(userId)) return;

  //   client.emit('notification:history:response', {
  //     notifications: [],
  //     page: payload.page,
  //     limit: payload.limit,
  //     hasMore: false,
  //   });
  // }

  private forceDisconnect(client: Socket, message: string) {
    client.emit('error', { message });
    client.disconnect(true);
  }
}
