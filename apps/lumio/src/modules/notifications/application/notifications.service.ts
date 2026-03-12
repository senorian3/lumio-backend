import { Injectable } from '@nestjs/common';
import { SubscriptionActiveNotificationDto } from '../api/dto/transfer/subscription-active-notification.transfer.dto';
import { NotificationType } from '../constants/notification-constants';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.repository';
import { NotificationQueryRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.query-repository';
import { NotificationPaginationTransferDto } from '@lumio/modules/notifications/api/dto/transfer/notification-pagination.transfer.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationQueryRepository: NotificationQueryRepository,
  ) {}

  async sendSubscriptionActiveNotification(
    data: SubscriptionActiveNotificationDto,
  ) {
    const dateObj = data.date instanceof Date ? data.date : new Date(data.date);

    await this.notificationRepository.createNotification({
      userId: data.userId,
      type: NotificationType.SUBSCRIPTION_ACTIVE,
      title: `Подписка активирована`,
      message: `Ваша подписка активирована и действует до ${dateObj.toLocaleDateString()}`,
      executeAt: new Date(new Date().getTime() + 30000).toISOString(),
    });
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepository.markAllAsRead(userId);
  }

  async getHistory(
    userId: number,
    pageNumber: number,
    pageSize: number,
    sortDirection: 'asc' | 'desc' = 'desc',
  ): Promise<NotificationPaginationTransferDto> {
    const result = await this.notificationQueryRepository.getHistory(
      userId,
      pageNumber,
      pageSize,
      sortDirection,
    );

    return result;
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    return this.notificationRepository.getUnreadCount(userId);
  }
}
