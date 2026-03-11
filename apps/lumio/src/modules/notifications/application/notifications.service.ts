import { SubscriptionActiveNotificationDto } from '../api/dto/transfer/subscription-active-notification.transfer.dto';
import { NotificationType } from '../constants/notification-constants';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.repository';

export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async sendSubscriptionActiveNotification(
    data: SubscriptionActiveNotificationDto,
  ) {
    await this.notificationRepository.createNotification({
      userId: data.userId,
      type: NotificationType.SUBSCRIPTION_ACTIVE,
      title: `Подписка активирована`,
      message: `Ваша подписка активирована и действует до ${data.date.toLocaleDateString()}`,
      executeAt: new Date(new Date().getTime() + 30000).toISOString(),
    });
  }
}
