import { Injectable } from '@nestjs/common';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { Stripe } from 'stripe';
import {
  OutboxAggregateType,
  OutboxEventType,
} from '../../constants/outbox-constants';

export interface ManualReviewTaskData {
  type: string;
  profileId?: string;
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

  async createFailedInitialPaymentTask(
    session: Stripe.Checkout.Session,
    error: Error,
  ): Promise<void> {
    await this.createManualReviewTask({
      type: OutboxEventType.FAILED_INITIAL_PAYMENT_PROCESSING,
      sessionId: session.id,
      subscriptionId: session.subscription.toString(),
      customPaymentId: session.metadata.customPaymentId,
      error: error.message,
      timestamp: new Date().toISOString(),
      retryCount: 5,
    });
  }

  async createFailedRecurringPaymentTask(
    invoice: Stripe.Invoice,
    error: Error,
  ): Promise<void> {
    await this.createManualReviewTask({
      type: OutboxEventType.FAILED_RECURRING_PAYMENT_PROCESSING,
      invoiceId: invoice.id,
      error: error.message,
      subscriptionId: invoice.lines.data[0].subscription.toString(),
      timestamp: new Date().toISOString(),
      retryCount: 5,
    });
  }

  async createFailedAutoRenewalChangeTask(
    subscriptionId: string,
    customPaymentId: string,
    error: Error,
  ): Promise<void> {
    await this.createManualReviewTask({
      type: OutboxEventType.FAILED_SUBSCRIPTION_CHANGE_AUTO_RENEWAL_PROCESSING,
      subscriptionId,
      customPaymentId,
      error: error.message,
      timestamp: new Date().toISOString(),
      retryCount: 5,
    });
  }

  private async createManualReviewTask(
    data: ManualReviewTaskData,
  ): Promise<void> {
    await this.outboxService.createManualReviewTask(
      data,
      data.customPaymentId,
      OutboxAggregateType.PAYMENT,
    );
  }
}
