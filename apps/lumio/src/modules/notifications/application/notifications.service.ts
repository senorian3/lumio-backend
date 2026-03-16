import { Injectable } from '@nestjs/common';
import { SubscriptionActiveNotificationDto } from '../api/dto/transfer/subscription-active-notification.transfer.dto';
import { NotificationType } from '../constants/notification-constants';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async markAllAsRead(userId: number) {
    await this.notificationRepository.markAllAsRead(userId);
  }

  async createSubscriptionActiveNotification(
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

  async createPaymentWarningNotification(
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

  async createSubscriptionExpiring1DayNotification(
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

  async createSubscriptionExpiring7DaysNotification(
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
