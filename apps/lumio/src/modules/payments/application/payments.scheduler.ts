import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppLoggerService } from '@libs/logger/logger.service';
import { NotificationsService } from '@lumio/modules/notifications/application/notifications.service';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';

@Injectable()
export class PaymentsScheduler {
  private static readonly HOURS_UNTIL_PAYMENT = 24;
  private static readonly DAYS_7_EXPIRY = 7;
  private static readonly DAYS_1_EXPIRY = 1;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly notificationsService: NotificationsService,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingPayments(): Promise<void> {
    const subscriptions =
      await this.subscriptionRepository.findSubscriptionsExpiring(
        PaymentsScheduler.HOURS_UNTIL_PAYMENT,
        true,
        'hours',
      );

    if (subscriptions.length === 0) {
      return;
    }

    for (const subscription of subscriptions) {
      try {
        await this.notificationsService.createPaymentWarningNotification(
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

  @Cron(CronExpression.EVERY_MINUTE)
  async checkSubscriptionsExpiring(): Promise<void> {
    try {
      const subscriptions7Days =
        await this.subscriptionRepository.findSubscriptionsExpiring(
          PaymentsScheduler.DAYS_7_EXPIRY,
          false,
          'days',
        );

      for (const subscription of subscriptions7Days) {
        try {
          await this.notificationsService.createSubscriptionExpiring7DaysNotification(
            subscription.userProfile.userId,
            subscription.endDate,
          );
        } catch (error) {
          this.logger.error(
            `Error sending 7-day expiration notification for user ${subscription.userProfile.userId}: ${error.message}`,
            error.stack,
            PaymentsScheduler.name,
          );
        }
      }

      const subscriptions1Day =
        await this.subscriptionRepository.findSubscriptionsExpiring(
          PaymentsScheduler.DAYS_1_EXPIRY,
          false,
          'days',
        );

      for (const subscription of subscriptions1Day) {
        try {
          await this.notificationsService.createSubscriptionExpiring1DayNotification(
            subscription.userProfile.userId,
            subscription.endDate,
          );
        } catch (error) {
          this.logger.error(
            `Error sending 1-day expiration notification for user ${subscription.userProfile.userId}: ${error.message}`,
            error.stack,
            PaymentsScheduler.name,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error in checkSubscriptionsExpiring scheduler: ${error.message}`,
        error.stack,
        PaymentsScheduler.name,
      );
    }
  }
}
