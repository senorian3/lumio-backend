import { Injectable } from '@nestjs/common';
import { OutboxRepository } from '../domain/outbox.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  OutboxAggregateType,
  OutboxEventType,
} from '../../constants/outbox-constants';
import { CreatePaymentCompleteMessageDto } from './dto/create-payment-complete-message.dto';
import { CreateSubscriptionUpdateMessageDto } from './dto/create-subscription-update-message';

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
          `Failed to create failed initial payment processing message for session ${payload.profileId}: ${error.message}`,
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
          aggregateId: payload.customPaymentId,
          aggregateType: OutboxAggregateType.PAYMENT,
          eventType: OutboxEventType.RECURRING_PAYMENT_COMPLETED,
          scheduledAt: new Date(),
          payload,
          ttl: new Date(Date.now() + 24 * 60 * 1000),
        },
        tx,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create outbox message for recurring payment ${payload.customPaymentId}: ${error.message}`,
        error.stack,
        OutboxService.name,
      );
      try {
        await this.createFailedRecurringPaymentCompleteMessage(
          {
            subscriptionId: payload.subscriptionId,
            customPaymentId: payload.customPaymentId,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
          tx,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create failed initial payment processing message for session with customPaymentId ${payload.customPaymentId}`,
          error.stack,
          OutboxService.name,
        );
        throw error;
      }
    }
  }

  async createFailedInitialPaymentProcessingMessage(
    payload: {
      profileId: string;
      subscriptionId?: string;
      customPaymentId?: string;
      error: string;
      timestamp: string;
    },
    tx?: any,
  ): Promise<void> {
    await this.outboxRepository.createOutboxMessage(
      {
        aggregateId: payload.customPaymentId,
        aggregateType: OutboxAggregateType.PAYMENT,
        eventType: OutboxEventType.FAILED_INITIAL_PAYMENT_PROCESSING,
        scheduledAt: new Date(),
        payload,
        ttl: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
      tx,
    );
  }

  async createFailedRecurringPaymentCompleteMessage(
    payload: {
      subscriptionId?: string;
      customPaymentId?: string;
      error: string;
      timestamp: string;
    },
    tx?: any,
  ): Promise<void> {
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
  }

  async createChangeSubscriptionAutoRenewalMessage(
    subscriptionId: string,
    paymentId: string,
    autoRenewal: boolean,
    tx?: any,
  ): Promise<void> {
    const payload = {
      subscriptionId,
      paymentId,
      autoRenewal,
      timestamp: new Date().toISOString(),
    };

    await this.outboxRepository.createOutboxMessage(
      {
        aggregateId: paymentId,
        aggregateType: OutboxAggregateType.PAYMENT,
        eventType: OutboxEventType.CHANGE_SUBSCRIPTION_AUTORENEWAL_COMPLETED,
        scheduledAt: new Date(),
        payload,
        ttl: new Date(Date.now() + 24 * 60 * 1000),
      },
      tx,
    );
  }

  async createChangeSubscriptionAutoRenewalStripe(
    subscriptionId: string,
    autoRenewal: boolean,
    tx?: any,
  ): Promise<void> {
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
}
