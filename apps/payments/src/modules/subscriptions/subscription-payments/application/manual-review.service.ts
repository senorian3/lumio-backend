import { Injectable } from '@nestjs/common';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { Stripe } from 'stripe';

export interface ManualReviewTaskData {
  type: string;
  sessionId?: string;
  subscriptionId?: string;
  customPaymentId?: string;
  invoiceId?: string;
  error?: string;
  timestamp: string;
  retryCount: number;
}

@Injectable()
export class ManualReviewService {
  constructor(
    private readonly outboxService: OutboxService,
    private readonly logger: AppLoggerService,
  ) {}

  async createManualReviewTask(data: ManualReviewTaskData): Promise<void> {
    await this.outboxService.createManualReviewTask(data);

    this.logger.error(
      `${data.type} - Failed after ${data.retryCount} retries`,
      null,
      'ManualReviewService',
    );

    if (data.sessionId) {
      this.logger.error(
        `Session ID: ${data.sessionId}`,
        null,
        'ManualReviewService',
      );
    }

    if (data.subscriptionId) {
      this.logger.error(
        `Subscription ID: ${data.subscriptionId}`,
        null,
        'ManualReviewService',
      );
    }

    if (data.customPaymentId) {
      this.logger.error(
        `Custom Payment ID: ${data.customPaymentId}`,
        null,
        'ManualReviewService',
      );
    }

    if (data.invoiceId) {
      this.logger.error(
        `Invoice ID: ${data.invoiceId}`,
        null,
        'ManualReviewService',
      );
    }

    if (data.error) {
      this.logger.error(`Error: ${data.error}`, null, 'ManualReviewService');
    }

    this.logger.error(
      `Timestamp: ${data.timestamp}`,
      null,
      'ManualReviewService',
    );
  }

  async createFailedRecurringPaymentTask(
    invoice: Stripe.Invoice,
    error: Error,
  ): Promise<void> {
    await this.createManualReviewTask({
      type: 'FAILED_RECURRING_PAYMENT_PROCESSING',
      invoiceId: invoice.id,
      subscriptionId: invoice.lines.data[0].subscription.toString(),
      timestamp: new Date().toISOString(),
      retryCount: 5,
    });

    this.logger.error(
      `Recurring payment processing failed after 5 retries: ${error.message}`,
      error.stack,
      'ManualReviewService',
    );
  }

  async createFailedInitialPaymentTask(
    session: Stripe.Checkout.Session,
    error: Error,
  ): Promise<void> {
    await this.createManualReviewTask({
      type: 'FAILED_WEBHOOK_PROCESSING',
      sessionId: session.id,
      subscriptionId: session.subscription?.toString(),
      customPaymentId: session.metadata.customPaymentId,
      error: error.message,
      timestamp: new Date().toISOString(),
      retryCount: 5,
    });

    this.logger.error(
      `Webhook processing failed after 5 retries: ${error.message}`,
      error.stack,
      'ManualReviewService',
    );
  }
}
