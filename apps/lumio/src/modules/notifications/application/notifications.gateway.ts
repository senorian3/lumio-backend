import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from '@lumio/modules/notifications/application/notifications.service';

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
  constructor(private readonly notificationsService: NotificationsService) {}

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

  async sendNotification(userId: number, title: string, message: string) {
    this.server.to(`user_${userId}`).emit('notification:new', {
      title,
      message,
    });

    this.server.to(`user_${userId}`).emit('notification:count', {
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

    await this.notificationsService.markAllAsRead(userId);

    this.server.to(`user_${userId}`).emit('notification:count', { count: 0 });
  }

  // @SubscribeMessage('notification:history')
  // async handleHistory(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody()
  //   payload: { pageNumber: number; pageSize: number; sortDirection: string },
  // ) {
  //   const userIdRaw =
  //     client.handshake.auth?.userId || client.handshake.query?.userId;
  //   const userId = Number(userIdRaw);
  //   if (!userId || isNaN(userId)) return;
  //
  //   client.emit('notification:history:response', {
  //     notifications: [],
  //     pageNumber: payload.pageNumber,
  //     pageSize: payload.pageSize,
  //   });
  // }

  private forceDisconnect(client: Socket, message: string) {
    client.emit('error', { message });
    client.disconnect(true);
  }
}
