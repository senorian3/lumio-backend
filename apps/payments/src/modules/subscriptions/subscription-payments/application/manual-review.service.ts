import { Injectable } from '@nestjs/common';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { Stripe } from 'stripe';
import {
  OutboxAggregateType,
  OutboxEventType,
} from '../../constants/outbox-constants';

export class ManualReviewTaskData {
  constructor(
    public type: string,
    public timestamp: string,
    public retryCount: number,
    public profileId?: string,
    public sessionId?: string,
    public subscriptionId?: string,
    public customPaymentId?: string,
    public invoiceId?: string,
    public error?: string,
  ) {}
}

@Injectable()
export class ManualReviewService {
  constructor(private readonly outboxService: OutboxService) {}

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

  async createFailedSubscriptionDeletedTask(
    subscriptionId: string,
    error: Error,
  ): Promise<void> {
    await this.createManualReviewTask({
      type: OutboxEventType.FAILED_SUBSCRIPTION_DELETED_PROCESSING,
      subscriptionId,
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
