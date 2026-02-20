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

  async processChangeSubscriptionAutoRenewal(
    message: OutboxMessage,
  ): Promise<boolean> {
    const payload = message.payload as {
      subscriptionId: string;
      autoRenewal: boolean;
    };

    try {
      await this.stripeAdapter.changeSubscriptionAutoRenewal(
        payload.subscriptionId,
        payload.autoRenewal,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to cancel auto-renewal for subscription ${payload.subscriptionId}: ${error.message}`,
        error.stack,
        ExternalCallsProcessor.name,
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
      this.logger.log(
        `Some logic for processing failed initial payment ${payload}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to process manual review task ${message.id}: ${error.message}`,
        error.stack,
        ExternalCallsProcessor.name,
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
      error: string;
      timestamp: string;
      retryCount: number;
    };

    try {
      this.logger.log(
        `Some logic for processing failed recurring payment ${payload}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to process failed recurring payment ${message.id}: ${error.message}`,
        error.stack,
        ExternalCallsProcessor.name,
      );
      return false;
    }
  }

  async processFailedSubscriptionChangeAutoRenewal(
    message: OutboxMessage,
  ): Promise<boolean> {
    const payload = message.payload as {
      type: string;
      subscriptionId: string;
      timestamp: string;
      retryCount: number;
    };

    try {
      this.logger.log(
        `Some logic for processing failed subscription change auto-renewal ${payload}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to process failed subscription change auto-renewal ${message.id}: ${error.message}`,
        error.stack,
        ExternalCallsProcessor.name,
      );
      return false;
    }
  }

  async processFailedSubscriptionDeleted(
    message: OutboxMessage,
  ): Promise<boolean> {
    const payload = message.payload as {
      subscriptionId: string;
      profileId: number;
      error: string;
      timestamp: string;
    };

    try {
      this.logger.log(
        `Processing failed subscription deleted: ${payload.subscriptionId}, error: ${payload.error}`,
        ExternalCallsProcessor.name,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to process failed subscription deleted ${message.id}: ${error.message}`,
        error.stack,
        ExternalCallsProcessor.name,
      );
      return false;
    }
  }

  async processManualReviewRequired(message: OutboxMessage): Promise<boolean> {
    const payload = message.payload as {
      type: string;
      subscriptionId: string;
      customPaymentId: string;
      error: string;
      timestamp: string;
      retryCount: number;
    };

    try {
      this.logger.log(
        `Some logic for processing manual review task ${payload}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to process manual review task ${message.id}: ${error.message}`,
        error.stack,
        ExternalCallsProcessor.name,
      );
      return false;
    }
  }
}
