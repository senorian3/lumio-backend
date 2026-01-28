import { Injectable } from '@nestjs/common';
import {
  OutboxRepository,
  OutboxAggregateType,
  OutboxEventType,
} from './outbox.repository';
import { AppLoggerService } from '@libs/logger/logger.service';

@Injectable()
export class OutboxService {
  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async createPaymentCompletedMessage(
    paymentId: number,
    paymentData: any,
  ): Promise<void> {
    const payload = {
      paymentId,
      profileId: paymentData.profileId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      subscriptionId: paymentData.subscriptionId,
      subscriptionType: paymentData.subscriptionType,
      periodStart: paymentData.periodStart,
      periodEnd: paymentData.periodEnd,
      nextPaymentDate: paymentData.nextPaymentDate,
      timestamp: new Date().toISOString(),
    };

    await this.outboxRepository.createOutboxMessage({
      aggregateId: paymentId,
      aggregateType: OutboxAggregateType.PAYMENT,
      eventType: OutboxEventType.PAYMENT_COMPLETED,
      payload,
      ttl: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes TTL
    });

    this.logger.log(
      `Created outbox message for payment ${paymentId}`,
      'OutboxService',
    );
  }

  async createPaymentFailedMessage(
    paymentId: number,
    error: string,
  ): Promise<void> {
    const payload = {
      paymentId,
      error,
      timestamp: new Date().toISOString(),
    };

    await this.outboxRepository.createOutboxMessage({
      aggregateId: paymentId,
      aggregateType: OutboxAggregateType.PAYMENT,
      eventType: OutboxEventType.PAYMENT_FAILED,
      payload,
      ttl: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes TTL
    });

    this.logger.log(
      `Created failed outbox message for payment ${paymentId}`,
      'OutboxService',
    );
  }

  async createSubscriptionCancelledMessage(
    paymentId: number,
    subscriptionId: string,
  ): Promise<void> {
    const payload = {
      paymentId,
      subscriptionId,
      timestamp: new Date().toISOString(),
    };

    await this.outboxRepository.createOutboxMessage({
      aggregateId: paymentId,
      aggregateType: OutboxAggregateType.PAYMENT,
      eventType: OutboxEventType.SUBSCRIPTION_CANCELLED,
      payload,
      ttl: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes TTL
    });

    this.logger.log(
      `Created cancelled outbox message for payment ${paymentId}`,
      'OutboxService',
    );
  }

  async createCancelSubscriptionMessage(
    paymentId: number,
    subscriptionId: string,
  ): Promise<void> {
    const payload = {
      paymentId,
      subscriptionId,
      timestamp: new Date().toISOString(),
    };

    await this.outboxRepository.createOutboxMessage({
      aggregateId: paymentId,
      aggregateType: OutboxAggregateType.PAYMENT,
      eventType: OutboxEventType.CANCEL_SUBSCRIPTION,
      payload,
      ttl: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes TTL
    });

    this.logger.log(
      `Created cancel subscription outbox message for payment ${paymentId}`,
      'OutboxService',
    );
  }

  async processPendingMessages(): Promise<void> {
    const messages = await this.outboxRepository.findPendingMessages(10);

    for (const message of messages) {
      try {
        await this.outboxRepository.markAsProcessing(message.id);
        this.logger.log(
          `Processing outbox message ${message.id}`,
          'OutboxService',
        );

        // Message will be sent by the scheduler
        // For now, just mark as completed since we'll handle actual sending in the scheduler
        await this.outboxRepository.markAsCompleted(message.id);
      } catch (error) {
        this.logger.error(
          `Failed to process outbox message ${message.id}: ${error.message}`,
          error.stack,
          'OutboxService',
        );
        await this.outboxRepository.incrementRetryCount(message.id);
      }
    }
  }

  async cleanupExpiredMessages(): Promise<void> {
    await this.outboxRepository.cleanupExpiredMessages();
    this.logger.log('Cleaned up expired outbox messages', 'OutboxService');
  }
}
