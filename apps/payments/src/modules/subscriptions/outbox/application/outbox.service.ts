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
    await this.outboxRepository.createOutboxMessage(
      {
        aggregateId: payload.paymentId,
        aggregateType: OutboxAggregateType.PAYMENT,
        eventType: OutboxEventType.PAYMENT_COMPLETED,
        payload,
        ttl: new Date(Date.now() + 30 * 60 * 1000),
      },
      tx,
    );

    this.logger.log(
      `Created outbox message for payment ${payload.paymentId}`,
      'OutboxService',
    );
  }

  //метод для отмены подписки от юзера
  async createSubscriptionCancelByUserMessage(
    paymentId: string,
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

  async createCancelSubscriptionAutoRenewalMessage(
    subscriptionId: string,
    paymentId: string,
    tx?: any,
  ): Promise<void> {
    const payload = {
      subscriptionId,
      paymentId,
      timestamp: new Date().toISOString(),
    };

    await this.outboxRepository.createOutboxMessage(
      {
        aggregateId: paymentId,
        aggregateType: OutboxAggregateType.PAYMENT,
        eventType: OutboxEventType.CANCEL_SUBSCRIPTION_AUTO_RENEWAL,
        payload,
        ttl: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes TTL
      },
      tx,
    );

    this.logger.log(
      `Created cancel subscription auto-renewal outbox message for subscription ${subscriptionId}`,
      'OutboxService',
    );
  }

  async createSubscriptionUpdatedMessage(
    payload: CreateSubscriptionUpdateMessageDto,
    tx?: any,
  ): Promise<void> {
    await this.outboxRepository.createOutboxMessage(
      {
        aggregateId: payload.customPaymentId,
        aggregateType: OutboxAggregateType.PAYMENT,
        eventType: OutboxEventType.SUBSCRIPTION_UPDATED,
        payload,
        ttl: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes TTL
      },
      tx,
    );

    this.logger.log(
      `Created subscription updated outbox message for payment ${payload.customPaymentId}`,
      'OutboxService',
    );
  }

  async cleanupExpiredMessages(): Promise<void> {
    await this.outboxRepository.cleanupExpiredMessages();
    this.logger.log('Cleaned up expired outbox messages', 'OutboxService');
  }

  async createManualReviewTask(payload: any, tx?: any): Promise<void> {
    await this.outboxRepository.createOutboxMessage(
      {
        aggregateId: payload.customPaymentId || payload.sessionId,
        aggregateType: OutboxAggregateType.PAYMENT,
        eventType: OutboxEventType.MANUAL_REVIEW_REQUIRED,
        payload,
        ttl: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      tx,
    );

    this.logger.log(
      `Created manual review task for session ${payload.sessionId}`,
      'OutboxService',
    );
  }
}
