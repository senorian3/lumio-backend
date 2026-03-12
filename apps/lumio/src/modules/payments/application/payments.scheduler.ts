import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppLoggerService } from '@libs/logger/logger.service';
import { NotificationsService } from '@lumio/modules/notifications/application/notifications.service';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';

@Injectable()
export class PaymentsScheduler {
  private static readonly HOURS_UNTIL_PAYMENT = 24;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly notificationsService: NotificationsService,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingPayments(): Promise<void> {
    const subscriptions =
      await this.subscriptionRepository.findSubscriptionsExpiringWithAutoRenewal(
        PaymentsScheduler.HOURS_UNTIL_PAYMENT,
      );

    if (subscriptions.length === 0) {
      return;
    }

    for (const subscription of subscriptions) {
      try {
        await this.notificationsService.sendPaymentWarningNotification(
          subscription.userProfile.userId,
          subscription.endDate,
        );
      } catch (error) {
        this.logger.error(
          `Error sending payment warning notification for user ${subscription.userProfile.userId}: ${error.message}`,
          error.stack,
          PaymentsScheduler.name,
        );
      }
    }
  }
}
