import { Injectable } from '@nestjs/common';
import { SubscriptionActiveNotificationDto } from '../api/dto/transfer/subscription-active-notification.transfer.dto';
import { NotificationType } from '../constants/notification-constants';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
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
}
