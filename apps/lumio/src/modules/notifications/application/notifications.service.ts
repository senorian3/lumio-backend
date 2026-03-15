import { Injectable } from '@nestjs/common';
import { SubscriptionActiveNotificationDto } from '../api/dto/transfer/subscription-active-notification.transfer.dto';
import { NotificationType } from '../constants/notification-constants';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.repository';
import { NotificationQueryRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.query-repository';
import { NotificationPaginationTransferDto } from '@lumio/modules/notifications/api/dto/transfer/notification-pagination.transfer.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationQueryRepository: NotificationQueryRepository,
  ) {}

  async markAllAsRead(userId: number) {
    await this.notificationRepository.markAllAsRead(userId);
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    return this.notificationRepository.getUnreadCount(userId);
  }

  async getHistory(
    userId: number,
    pageNumber: number = 1,
    pageSize: number = 10,
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

  async sendSubscriptionActiveNotification(
    data: SubscriptionActiveNotificationDto,
  ): Promise<void> {
    await this.notificationRepository.createNotification({
      userId: data.userId,
      type: NotificationType.SUBSCRIPTION_ACTIVE,
      title: `Подписка активирована`,
      message: `Ваша подписка активирована и действует до ${data.date.toLocaleDateString()}`,
      executeAt: new Date(new Date().getTime() + 30000).toISOString(),
    });
  }

  async sendPaymentWarningNotification(
    userId: number,
    endDate: Date,
  ): Promise<void> {
    await this.notificationRepository.createNotification({
      userId,
      type: NotificationType.PAYMENT_WARNING,
      title: 'Уведомление о платеже',
      message: `Следующий платеж у вас спишется через 1 день (${endDate.toLocaleDateString()})`,
      executeAt: new Date().toISOString(),
    });
  }

  async sendSubscriptionExpiring1DayNotification(
    userId: number,
    endDate: Date,
  ): Promise<void> {
    await this.notificationRepository.createNotification({
      userId,
      type: NotificationType.SUBSCRIPTION_EXPIRING_1DAY,
      title: 'Подписка истекает',
      message: `Ваша подписка истекает через 1 день (${endDate.toLocaleDateString()})`,
      executeAt: new Date().toISOString(),
    });
  }

  async sendSubscriptionExpiring7DaysNotification(
    userId: number,
    endDate: Date,
  ): Promise<void> {
    await this.notificationRepository.createNotification({
      userId,
      type: NotificationType.SUBSCRIPTION_EXPIRING_7DAYS,
      title: 'Подписка истекает',
      message: `Ваша подписка истекает через 7 дней (${endDate.toLocaleDateString()})`,
      executeAt: new Date().toISOString(),
    });
  }
}
