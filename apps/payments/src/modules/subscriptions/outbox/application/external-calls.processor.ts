import { Injectable } from '@nestjs/common';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxMessage } from 'generated/prisma-payments';

@Injectable()
export class ExternalCallsProcessor {
  constructor(
    private readonly stripeAdapter: StripeAdapter,
    private readonly logger: AppLoggerService,
  ) {}

  async processCancelSubscription(message: OutboxMessage): Promise<boolean> {
    const payload = message.payload as {
      subscriptionId: string;
    };

    try {
      await this.stripeAdapter.cancelSubscriptionAtPeriodEnd(
        payload.subscriptionId,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription ${payload.subscriptionId}: ${error.message}`,
        error.stack,
        'ExternalCallsProcessor',
      );
      return false;
    }
  }

  async processFailedInitialPayment(message: OutboxMessage): Promise<boolean> {
    const payload = message.payload as {
      type: string;
      sessionId: string;
      subscriptionId?: string;
      customPaymentId?: string;
      error: string;
      timestamp: string;
      retryCount: number;
    };

    try {
      // Логируем информацию о задаче для ручного разбора
      this.logger.error(
        `MANUAL REVIEW REQUIRED - Failed webhook processing after ${payload.retryCount} retries`,
        null,
        'ExternalCallsProcessor',
      );

      this.logger.error(
        `Session ID: ${payload.sessionId}`,
        null,
        'ExternalCallsProcessor',
      );

      if (payload.subscriptionId) {
        this.logger.error(
          `Subscription ID: ${payload.subscriptionId}`,
          null,
          'ExternalCallsProcessor',
        );
      }

      if (payload.customPaymentId) {
        this.logger.error(
          `Custom Payment ID: ${payload.customPaymentId}`,
          null,
          'ExternalCallsProcessor',
        );
      }

      this.logger.error(
        `Error: ${payload.error}`,
        null,
        'ExternalCallsProcessor',
      );

      this.logger.error(
        `Timestamp: ${payload.timestamp}`,
        null,
        'ExternalCallsProcessor',
      );

      // Можно добавить отправку уведомления в Slack, email или другие системы
      // Например: await this.notificationService.sendManualReviewAlert(payload);

      return true; // Задача обработана (записана в лог), можно помечать как completed
    } catch (error) {
      this.logger.error(
        `Failed to process manual review task ${message.id}: ${error.message}`,
        error.stack,
        'ExternalCallsProcessor',
      );
      return false;
    }
  }

  async processFailedRecurringPayment(
    message: OutboxMessage,
  ): Promise<boolean> {
    const payload = message.payload as {
      type: string;
      invoiceId: string;
      subscriptionId: string;
      timestamp: string;
      retryCount: number;
    };

    try {
      // Логируем информацию о неудачной обработке рекуррентного платежа
      this.logger.error(
        `FAILED RECURRING PAYMENT PROCESSING - Failed after ${payload.retryCount} retries`,
        null,
        'ExternalCallsProcessor',
      );

      this.logger.error(
        `Invoice ID: ${payload.invoiceId}`,
        null,
        'ExternalCallsProcessor',
      );

      this.logger.error(
        `Subscription ID: ${payload.subscriptionId}`,
        null,
        'ExternalCallsProcessor',
      );

      this.logger.error(
        `Timestamp: ${payload.timestamp}`,
        null,
        'ExternalCallsProcessor',
      );

      this.logger.error(
        `Retry Count: ${payload.retryCount}`,
        null,
        'ExternalCallsProcessor',
      );

      // Можно добавить отправку уведомления в Slack, email или другие системы
      // Например: await this.notificationService.sendFailedRecurringPaymentAlert(payload);

      return true; // Задача обработана (записана в лог), можно помечать как completed
    } catch (error) {
      this.logger.error(
        `Failed to process failed recurring payment ${message.id}: ${error.message}`,
        error.stack,
        'ExternalCallsProcessor',
      );
      return false;
    }
  }
}
