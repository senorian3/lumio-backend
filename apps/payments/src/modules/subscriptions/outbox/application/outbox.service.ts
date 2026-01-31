import { Injectable } from '@nestjs/common';
import { OutboxRepository } from '../domain/outbox.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  OutboxAggregateType,
  OutboxEventType,
} from '../../constants/outbox-constants';

@Injectable()
export class OutboxService {
  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async createPaymentCompletedMessage(
    paymentId: number,
    paymentData: any,
    tx?: any,
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

    await this.outboxRepository.createOutboxMessage(
      {
        aggregateId: paymentId,
        aggregateType: OutboxAggregateType.PAYMENT,
        eventType: OutboxEventType.PAYMENT_COMPLETED,
        payload,
        ttl: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes TTL
      },
      tx,
    );

    this.logger.log(
      `Created outbox message for payment ${paymentId}`,
      'OutboxService',
    );
  }

  async createSubscriptionCancelledMessage(
    paymentId: number,
    subscriptionId: string,
    tx?: any,
  ): Promise<void> {
    const payload = {
      paymentId,
      subscriptionId,
      timestamp: new Date().toISOString(),
    };

    await this.outboxRepository.createOutboxMessage(
      {
        aggregateId: paymentId,
        aggregateType: OutboxAggregateType.PAYMENT,
        eventType: OutboxEventType.SUBSCRIPTION_CANCELLED,
        payload,
        ttl: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes TTL
      },
      tx,
    );

    this.logger.log(
      `Created cancelled outbox message for payment ${paymentId}`,
      'OutboxService',
    );
  }

  async createCancelSubscriptionMessage(
    paymentId: number,
    subscriptionId: string,
    tx?: any,
  ): Promise<void> {
    const payload = {
      paymentId,
      subscriptionId,
      timestamp: new Date().toISOString(),
    };

    await this.outboxRepository.createOutboxMessage(
      {
        aggregateId: paymentId,
        aggregateType: OutboxAggregateType.PAYMENT,
        eventType: OutboxEventType.CANCEL_SUBSCRIPTION,
        payload,
        ttl: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes TTL
      },
      tx,
    );

    this.logger.log(
      `Created cancel subscription outbox message for payment ${paymentId}`,
      'OutboxService',
    );
  }

  async createSubscriptionUpdatedMessage(
    paymentId: number,
    subscriptionId: string,
    subscriptionType: string,
    periodEnd: Date,
    nextPaymentDate: Date,
    tx?: any,
  ): Promise<void> {
    const payload = {
      paymentId,
      subscriptionId,
      subscriptionType,
      periodEnd,
      nextPaymentDate,
      timestamp: new Date().toISOString(),
    };

    await this.outboxRepository.createOutboxMessage(
      {
        aggregateId: paymentId,
        aggregateType: OutboxAggregateType.PAYMENT,
        eventType: OutboxEventType.SUBSCRIPTION_UPDATED,
        payload,
        ttl: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes TTL
      },
      tx,
    );

    this.logger.log(
      `Created subscription updated outbox message for payment ${paymentId}`,
      'OutboxService',
    );
  }

  async cleanupExpiredMessages(): Promise<void> {
    await this.outboxRepository.cleanupExpiredMessages();
    this.logger.log('Cleaned up expired outbox messages', 'OutboxService');
  }
}
