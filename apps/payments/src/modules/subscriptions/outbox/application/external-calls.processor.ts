import { Injectable } from '@nestjs/common';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxMessage } from 'generated/prisma-payments';
import { UpdateCustomerSubscriptionEndDateDto } from '@libs/dto/transfer/update-customer-subscription-end-date.dto';
import { UpdateSubscriptionMetadataDto } from '@libs/dto/transfer/update-subscription-metadata.dto';
import { CancelSubscriptionImmediatelyDto } from '@libs/dto/transfer/cancel-subscription-immediately.dto';

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
      stripeSubscriptionId: string;
      autoRenewal: boolean;
    };

    try {
      await this.stripeAdapter.changeSubscriptionAutoRenewal(
        payload.stripeSubscriptionId,
        payload.autoRenewal,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to cancel auto-renewal for stripe subscription ${payload.stripeSubscriptionId}: ${error.message}`,
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
      stripeSubscriptionId: string;
      profileId: number;
      error: string;
      timestamp: string;
    };

    try {
      this.logger.log(
        `Processing failed stripe subscription deleted: ${payload.stripeSubscriptionId}, error: ${payload.error}`,
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

  async processUpdateCustomerSubscriptionEndDate(
    message: OutboxMessage,
  ): Promise<boolean> {
    const payload =
      message.payload as unknown as UpdateCustomerSubscriptionEndDateDto;

    try {
      await this.stripeAdapter.updateCustomerSubscriptionEndDate(
        payload.stripeSubscriptionId,
        payload.periodEndDate,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to update customer subscription end date for stripe subscription ${payload.stripeSubscriptionId}: ${error.message}`,
        error.stack,
        ExternalCallsProcessor.name,
      );
      return false;
    }
  }

  async processCancelSubscriptionImmediately(
    message: OutboxMessage,
  ): Promise<boolean> {
    const payload =
      message.payload as unknown as CancelSubscriptionImmediatelyDto;

    try {
      await this.stripeAdapter.cancelSubscriptionImmediately(
        payload.stripeSubscriptionId,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription immediately for stripe subscription ${payload.stripeSubscriptionId}: ${error.message}`,
        error.stack,
        ExternalCallsProcessor.name,
      );
      return false;
    }
  }

  async processUpdateSubscriptionMetadata(
    message: OutboxMessage,
  ): Promise<boolean> {
    const payload = message.payload as unknown as UpdateSubscriptionMetadataDto;

    try {
      await this.stripeAdapter.updateSubscriptionMetadata(
        payload.stripeSubscriptionId,
        payload.metadata,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to update subscription metadata for stripe subscription ${payload.stripeSubscriptionId}: ${error.message}`,
        error.stack,
        ExternalCallsProcessor.name,
      );
      return false;
    }
  }
}
