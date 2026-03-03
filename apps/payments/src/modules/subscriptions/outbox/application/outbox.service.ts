import { Injectable } from '@nestjs/common';
import { OutboxRepository } from '../domain/outbox.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  OutboxAggregateType,
  OutboxEventType,
} from '../../constants/outbox-constants';
import { CreateSubscriptionUpdateMessageDto } from '@libs/dto/transfer/create-subscription-update-message.dto';
import { CreatePaymentCompleteMessageDto } from '@libs/dto/transfer/create-payment-complete-message.dto';
import { CreateSubscriptionDeletedMessageDto } from '@libs/dto/transfer/create-subscription-deleted-message.dto';
import { UpdateCustomerSubscriptionEndDateDto } from '@libs/dto/transfer/update-customer-subscription-end-date.dto';
import { UpdateSubscriptionMetadataDto } from '@libs/dto/transfer/update-subscription-metadata.dto';
import { CancelSubscriptionImmediatelyDto } from '@libs/dto/transfer/cancel-subscription-immediately.dto';

@Injectable()
export class OutboxService {
  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async createPaymentCompletedMessage(
    payload: CreatePaymentCompleteMessageDto,
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.paymentId,
          aggregateType: OutboxAggregateType.PAYMENT,
          eventType: OutboxEventType.PAYMENT_COMPLETED,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create outbox message for payment ${payload.paymentId}: ${error.message}`,
        error.stack,
        OutboxService.name,
      );

      try {
        await this.createFailedInitialPaymentProcessingMessage(
          {
            profileId: payload.profileId.toString(),
            subscriptionId: payload.subscriptionId,
            customPaymentId: payload.paymentId,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
          tx,
        );
      } catch (error) {
        this.logger.error(
          `Critical error creating failed initial payment processing message for session with customPaymentId ${payload.paymentId}`,
          error.stack,
          OutboxService.name,
        );
        throw error;
      }
    }
  }

  async createSubscriptionUpdatedMessage(
    payload: CreateSubscriptionUpdateMessageDto,
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.paymentId,
          aggregateType: OutboxAggregateType.PAYMENT,
          eventType: OutboxEventType.PAYMENT_RECURRING_COMPLETED,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create outbox message for recurring payment ${payload.paymentId}: ${error.message}`,
        error.stack,
        OutboxService.name,
      );
      try {
        await this.createFailedRecurringPaymentCompleteMessage(
          {
            subscriptionId: payload.subscriptionId,
            customPaymentId: payload.paymentId,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
          tx,
        );
      } catch (error) {
        this.logger.error(
          `Critical error creating outbox message for recurring payment ${payload.paymentId}: ${error.message}`,
          error.stack,
          OutboxService.name,
        );
        throw error;
      }
    }
  }

  async createChangeSubscriptionAutoRenewalStripe(
    subscriptionId: string,
    autoRenewal: boolean,
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: subscriptionId,
          aggregateType: OutboxAggregateType.SUBSCRIPTION,
          eventType: OutboxEventType.CHANGE_SUBSCRIPTION_AUTORENEWAL_STRIPE,
          scheduledAt: new Date(),
          payload: {
            subscriptionId,
            autoRenewal,
            timestamp: new Date().toISOString(),
          },
          ttl: new Date(Date.now() + 24 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create outbox message for subscription auto-renewal change ${subscriptionId}: ${error.message}`,
        error.stack,
        OutboxService.name,
      );

      try {
        await this.createFailedSubscriptionChangeAutoRenewalStripe(
          {
            subscriptionId,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
          tx,
        );
      } catch (innerError) {
        this.logger.error(
          `Critical error creating outbox message for subscription auto-renewal change ${subscriptionId}: ${innerError.message}`,
          innerError.stack,
          OutboxService.name,
        );
        throw error;
      }
    }
  }

  async createSubscriptionDeletedMessage(
    payload: CreateSubscriptionDeletedMessageDto,
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.subscriptionId,
          aggregateType: OutboxAggregateType.SUBSCRIPTION,
          eventType: OutboxEventType.SUBSCRIPTION_DELETED,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create outbox message for subscription deleted ${payload.subscriptionId}: ${error.message}`,
        error.stack,
        OutboxService.name,
      );

      try {
        await this.createFailedSubscriptionDeletedMessage(
          {
            subscriptionId: payload.subscriptionId,
            profileId: payload.profileId,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
          tx,
        );
      } catch (innerError) {
        this.logger.error(
          `Critical error creating outbox message for subscription deleted ${payload.subscriptionId}: ${innerError.message}`,
          innerError.stack,
          OutboxService.name,
        );
        throw error;
      }
    }
  }

  async cleanupExpiredMessages(): Promise<void> {
    await this.outboxRepository.cleanupExpiredMessages();
  }

  async createManualReviewTask(
    payload: any,
    aggregateId: string,
    aggregateType: OutboxAggregateType,
  ): Promise<void> {
    await this.outboxRepository.createOutboxMessage({
      aggregateId,
      aggregateType,
      eventType: OutboxEventType.MANUAL_REVIEW_REQUIRED,
      payload,
      scheduledAt: new Date(),
      ttl: new Date(Date.now() + 24 * 60 * 1000),
    });
  }

  async updateCustomerSubscriptionEndDateMessage(
    payload: UpdateCustomerSubscriptionEndDateDto,
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.subscriptionId,
          aggregateType: OutboxAggregateType.SUBSCRIPTION,
          eventType:
            OutboxEventType.UPDATE_CUSTOMER_SUBSCRIPTION_END_DATE_STRIPE,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create outbox message for updating customer subscription end date ${payload.subscriptionId}: ${error.message}`,
        error.stack,
        OutboxService.name,
      );

      try {
        await this.createFailedUpdateCustomerSubscriptionEndDateMessage(
          {
            subscriptionId: payload.subscriptionId,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
          tx,
        );
      } catch (innerError) {
        this.logger.error(
          `Critical error creating outbox message for updating customer subscription end date ${payload.subscriptionId}: ${innerError.message}`,
          innerError.stack,
          OutboxService.name,
        );
        throw error;
      }
    }
  }

  async createCancelSubscriptionImmediatelyMessage(
    payload: CancelSubscriptionImmediatelyDto,
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.subscriptionId,
          aggregateType: OutboxAggregateType.SUBSCRIPTION,
          eventType: OutboxEventType.CANCEL_SUBSCRIPTION_IMMEDIATELY_STRIPE,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create outbox message for canceling subscription immediately ${payload.subscriptionId}: ${error.message}`,
        error.stack,
        OutboxService.name,
      );

      try {
        await this.createFailedCancelSubscriptionImmediatelyMessage(
          {
            subscriptionId: payload.subscriptionId,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
          tx,
        );
      } catch (innerError) {
        this.logger.error(
          `Critical error creating outbox message for canceling subscription immediately ${payload.subscriptionId}: ${innerError.message}`,
          innerError.stack,
          OutboxService.name,
        );
        throw error;
      }
    }
  }

  async updateSubscriptionMetadataMessage(
    payload: UpdateSubscriptionMetadataDto,
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.subscriptionId,
          aggregateType: OutboxAggregateType.SUBSCRIPTION,
          eventType: OutboxEventType.UPDATE_SUBSCRIPTION_METADATA_STRIPE,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create outbox message for updating subscription metadata ${payload.subscriptionId}: ${error.message}`,
        error.stack,
        OutboxService.name,
      );

      try {
        await this.createFailedUpdateSubscriptionMetadataMessage(
          {
            subscriptionId: payload.subscriptionId,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
          tx,
        );
      } catch (innerError) {
        this.logger.error(
          `Critical error creating outbox message for updating subscription metadata ${payload.subscriptionId}: ${innerError.message}`,
          innerError.stack,
          OutboxService.name,
        );
        throw error;
      }
    }
  }

  private async createFailedInitialPaymentProcessingMessage(
    payload: {
      profileId: string;
      subscriptionId?: string;
      customPaymentId?: string;
      error: string;
      timestamp: string;
    },
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.customPaymentId,
          aggregateType: OutboxAggregateType.PAYMENT,
          eventType: OutboxEventType.FAILED_INITIAL_PAYMENT_PROCESSING,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      throw error;
    }
  }

  private async createFailedRecurringPaymentCompleteMessage(
    payload: {
      subscriptionId?: string;
      customPaymentId?: string;
      error: string;
      timestamp: string;
    },
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.customPaymentId,
          aggregateType: OutboxAggregateType.PAYMENT,
          eventType: OutboxEventType.FAILED_RECURRING_PAYMENT_PROCESSING,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      throw error;
    }
  }

  private async createFailedSubscriptionChangeAutoRenewalStripe(
    payload: {
      subscriptionId: string;
      error: string;
      timestamp: string;
    },
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.subscriptionId,
          aggregateType: OutboxAggregateType.SUBSCRIPTION,
          eventType:
            OutboxEventType.FAILED_SUBSCRIPTION_CHANGE_AUTO_RENEWAL_PROCESSING,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      throw error;
    }
  }

  private async createFailedSubscriptionDeletedMessage(
    payload: {
      subscriptionId: string;
      profileId: number;
      error: string;
      timestamp: string;
    },
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.subscriptionId,
          aggregateType: OutboxAggregateType.SUBSCRIPTION,
          eventType: OutboxEventType.FAILED_SUBSCRIPTION_DELETED_PROCESSING,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      throw error;
    }
  }

  private async createFailedUpdateCustomerSubscriptionEndDateMessage(
    payload: {
      subscriptionId: string;
      error: string;
      timestamp: string;
    },
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.subscriptionId,
          aggregateType: OutboxAggregateType.SUBSCRIPTION,
          eventType:
            OutboxEventType.FAILED_UPDATE_CUSTOMER_SUBSCRIPTION_END_DATE_PROCESSING,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      throw error;
    }
  }

  private async createFailedCancelSubscriptionImmediatelyMessage(
    payload: {
      subscriptionId: string;
      error: string;
      timestamp: string;
    },
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.subscriptionId,
          aggregateType: OutboxAggregateType.SUBSCRIPTION,
          eventType:
            OutboxEventType.FAILED_CANCEL_SUBSCRIPTION_IMMEDIATELY_PROCESSING,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      throw error;
    }
  }

  private async createFailedUpdateSubscriptionMetadataMessage(
    payload: {
      subscriptionId: string;
      error: string;
      timestamp: string;
    },
    tx?: any,
  ): Promise<void> {
    try {
      await this.outboxRepository.createOutboxMessage(
        {
          aggregateId: payload.subscriptionId,
          aggregateType: OutboxAggregateType.SUBSCRIPTION,
          eventType:
            OutboxEventType.FAILED_UPDATE_SUBSCRIPTION_METADATA_PROCESSING,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      throw error;
    }
  }
}
