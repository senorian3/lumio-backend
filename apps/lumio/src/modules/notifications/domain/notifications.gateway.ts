import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  // MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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

  sendNotification(userId: number, notification: any) {
    this.server.to(`user_${userId}`).emit('notification:new', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      metadata: notification.metadata,
    });

    //переделать под БД с кол-вом непрочитанных сообщений
    this.server.to(`user_${userId}`).emit('notification:count', {
      count: notification.isRead ? 0 : 1,
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
    //переделать запрос в БД на кол-во непрочитанных
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
