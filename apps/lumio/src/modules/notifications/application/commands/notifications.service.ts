import { SubscriptionActiveNotificationDto } from '../../api/dto/transfer/subscription-active-notification.transfer.dto';
import { NotificationType } from '../../constants/notification-constants';
import { NotificationsGateway } from '../notifications.gateway';

export class NotificationsService {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  async sendSubscriptionActiveNotification(
    data: SubscriptionActiveNotificationDto,
  ) {
    await this.notificationsGateway.sendNotification({
      userId: data.userId,
      type: NotificationType.SUBSCRIPTION_ACTIVE,
      title: `Подписка активирована`,
      message: `Ваша подписка активирована и действует до ${data.date.toLocaleDateString()}`,
      executeAt: new Date(data.date.getTime() + 30000).toISOString(),
    });
  }
}
