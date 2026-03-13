import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from '@lumio/modules/notifications/application/notifications.service';
import { NotificationHistoryParams } from '@lumio/modules/notifications/api/dto/input/test';
import { AppLoggerService } from '@libs/logger/logger.service';
import { JwtService } from '@nestjs/jwt';
import { ExternalQuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.external-query.repository';
import { UserAccountsConfig } from '@lumio/modules/user-accounts/config/user-accounts.config';

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

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly logger: AppLoggerService,
    private readonly jwtService: JwtService,
    private readonly sessionRepository: ExternalQuerySessionsRepository,
    private readonly userAccountsConfig: UserAccountsConfig,
  ) {}

  async handleConnection(client: Socket) {
    const userId = await this.validateTokenAndGetUserId(client);
    if (!userId) return;

    client.data.userId = userId;
    client.join(`user_${userId}`);

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);

    const unreadCount =
      await this.notificationsService.getUnreadNotificationsCount(userId);

    this.emitUnreadCount(client, unreadCount);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as number | undefined;
    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  async sendNotification(userId: number, title: string, message: string) {
    this.server.to(`user_${userId}`).emit('notification:new', {
      title,
      message,
    });

    const unreadCount =
      await this.notificationsService.getUnreadNotificationsCount(userId);

    this.server.to(`user_${userId}`).emit('notification:count', {
      count: unreadCount,
    });
  }

  async emitUnreadCount(client: Socket, unreadCount: number) {
    client.emit('notification:count', { count: unreadCount });
  }

  @SubscribeMessage('notification:read_all')
  async handleReadAll(@ConnectedSocket() client: Socket) {
    const userId = client.data?.userId as number | undefined;
    if (!userId) return;

    await this.notificationsService.markAllAsRead(userId);
    this.server.to(`user_${userId}`).emit('notification:count', { count: 0 });
  }

  @SubscribeMessage('notification:history')
  async handleHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: NotificationHistoryParams,
  ): Promise<void> {
    const userId = client.data?.userId as number | undefined;

    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const history = await this.notificationsService.getHistory(
        userId,
        payload.pageNumber,
        payload.pageSize,
        payload.sortDirection,
      );

      await this.notificationsService.markAllAsRead(userId);
      this.server.to(`user_${userId}`).emit('notification:count', { count: 0 });

      client.emit('notification:history:response', history);
    } catch (error) {
      this.logger.error(
        `Error in notifications gateway: ${error.message}`,
        error.stack,
        NotificationsGateway.name,
      );
    }
  }

  private async validateTokenAndGetUserId(
    client: Socket,
  ): Promise<number | null> {
    try {
      const token = client.handshake.query?.token as string;

      if (!token) {
        this.forceDisconnect(client, 'Unauthorized: Missing token');
        return null;
      }

      const payload = this.jwtService.verify<{
        userId: number;
        deviceId: string;
        tokenVersion: number;
      }>(token, { secret: this.userAccountsConfig.accessTokenSecret });

      if (!payload.userId || !payload.deviceId) {
        this.forceDisconnect(client, 'Unauthorized: Invalid token payload');
        return null;
      }

      const session = await this.sessionRepository.getSessionByUserAndDeviceId(
        payload.userId,
        payload.deviceId,
      );

      if (!session) {
        this.forceDisconnect(client, 'Unauthorized: No active session');
        return null;
      }

      if (
        payload.tokenVersion !== undefined &&
        session.tokenVersion > payload.tokenVersion
      ) {
        this.forceDisconnect(client, 'Unauthorized: Token invalidated');
        return null;
      }

      return payload.userId;
    } catch (error) {
      this.logger.error(
        `WebSocket connection error: ${error.message}`,
        error.stack,
        NotificationsGateway.name,
      );
      this.forceDisconnect(client, 'Unauthorized: Invalid token');
      return null;
    }
  }

  private forceDisconnect(client: Socket, message: string) {
    client.emit('error', { message });
    client.disconnect(true);
  }
}
