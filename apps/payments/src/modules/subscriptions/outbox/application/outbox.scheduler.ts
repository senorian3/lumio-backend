import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxRepository } from '../domain/outbox.repository';
import { PaymentsRepository } from '../../subscription-payments/domain/infrastructure/payments.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { ExternalCallsProcessor } from './external-calls.processor';
import { OutboxEventType } from '../../constants/outbox-constants';

@Injectable()
export class OutboxScheduler {
  constructor(
    @Inject('LUMIO_SERVICE')
    private readonly lumioService: ClientProxy,
    private readonly outboxRepository: OutboxRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly logger: AppLoggerService,
    private readonly externalCallsProcessor: ExternalCallsProcessor,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxMessages(): Promise<void> {
    try {
      const messages = await this.outboxRepository.findPendingMessages(100);

      if (messages.length === 0) {
        return;
      }

      for (const message of messages) {
        try {
          await this.outboxRepository.markAsProcessing(message.id);

          let result: boolean;

          switch (message.eventType) {
            case OutboxEventType.CHANGE_SUBSCRIPTION_AUTORENEWAL_STRIPE:
              result =
                await this.externalCallsProcessor.processChangeSubscriptionAutoRenewal(
                  message,
                );
              break;

            case OutboxEventType.FAILED_INITIAL_PAYMENT_PROCESSING:
              result =
                await this.externalCallsProcessor.processFailedInitialPayment(
                  message,
                );
              break;

            case OutboxEventType.FAILED_RECURRING_PAYMENT_PROCESSING:
              result =
                await this.externalCallsProcessor.processFailedRecurringPayment(
                  message,
                );
              break;
            case OutboxEventType.FAILED_SUBSCRIPTION_CHANGE_AUTO_RENEWAL_PROCESSING:
              result =
                await this.externalCallsProcessor.processFailedSubscriptionChangeAutoRenewal(
                  message,
                );
              break;
            case OutboxEventType.FAILED_SUBSCRIPTION_DELETED_PROCESSING:
              result =
                await this.externalCallsProcessor.processFailedSubscriptionDeleted(
                  message,
                );
              break;
            case OutboxEventType.UPDATE_CUSTOMER_SUBSCRIPTION_END_DATE_STRIPE:
              result =
                await this.externalCallsProcessor.processUpdateCustomerSubscriptionEndDate(
                  message,
                );
              break;
            case OutboxEventType.CANCEL_SUBSCRIPTION_IMMEDIATELY_STRIPE:
              result =
                await this.externalCallsProcessor.processCancelSubscriptionImmediately(
                  message,
                );
              break;
            case OutboxEventType.UPDATE_SUBSCRIPTION_METADATA_STRIPE:
              result =
                await this.externalCallsProcessor.processUpdateSubscriptionMetadata(
                  message,
                );
              break;
            case OutboxEventType.MANUAL_REVIEW_REQUIRED:
              result =
                await this.externalCallsProcessor.processManualReviewRequired(
                  message,
                );
              break;
            case OutboxEventType.PAYMENT_COMPLETED:
            case OutboxEventType.PAYMENT_RECURRING_COMPLETED:
            case OutboxEventType.SUBSCRIPTION_DELETED:
              result = await this.sendMessageToLumio(message);
              break;

            default:
              result = false;
          }

          if (result) {
            await this.outboxRepository.markAsCompleted(message.id, new Date());
          } else {
            await this.outboxRepository.incrementRetryCount(message.id);
          }
        } catch (error) {
          this.logger.error(
            `Error processing outbox message ${message.id}: ${error.message}`,
            error.stack,
            OutboxScheduler.name,
          );
          await this.outboxRepository.incrementRetryCount(message.id);
        }
      }
    } catch (error) {
      this.logger.error(
        `Critical error in outbox scheduler: ${error.message}`,
        error.stack,
        OutboxScheduler.name,
      );
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanupExpiredPendingPayments(): Promise<void> {
    try {
      const expiredBefore = new Date(Date.now() - (60 * 60 * 1000 + 60 * 1000));

      const deletedCount =
        await this.paymentsRepository.deleteExpiredPendingPayments(
          expiredBefore,
        );

      if (deletedCount > 0) {
        this.logger.log(
          `Cleaned up ${deletedCount} expired pending payments`,
          'OutboxScheduler',
        );
      }
    } catch (error) {
      this.logger.error(
        `Error cleaning up expired pending payments: ${error.message}`,
        error.stack,
        OutboxScheduler.name,
      );
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredMessages(): Promise<void> {
    try {
      const count = await this.outboxRepository.cleanupExpiredMessages();
      if (count > 0) {
        this.logger.log(
          `Cleaned up ${count} expired messages`,
          'OutboxScheduler',
        );
      }
    } catch (error) {
      this.logger.error(
        `Error cleaning up expired messages: ${error.message}`,
        error.stack,
        OutboxScheduler.name,
      );
    }
  }

  private async sendMessageToLumio(message: any): Promise<boolean> {
    try {
      const routingKey = this.getRoutingKey(message.eventType);

      const messageId = `outbox-${message.id}-${Date.now()}`;

      this.lumioService.emit(routingKey, {
        id: message.id,
        aggregateId: message.aggregateId,
        aggregateType: message.aggregateType,
        eventType: message.eventType,
        payload: message.payload,
        _messageId: messageId,
        _retryCount: 0,
        timestamp: message.createdAt,
      });

      this.logger.log(
        `Message sent to Lumio with ID: ${messageId}, routing key: ${routingKey}`,
        OutboxScheduler.name,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send message to Lumio: ${error.message}`,
        error.stack,
        OutboxScheduler.name,
      );
      return false;
    }
  }

  private getRoutingKey(eventType: string): string {
    switch (eventType) {
      case OutboxEventType.PAYMENT_COMPLETED:
        return 'payment.completed';
      case OutboxEventType.PAYMENT_RECURRING_COMPLETED:
        return 'payment.recurring.completed';
      case OutboxEventType.SUBSCRIPTION_DELETED:
        return 'subscription.deleted';

      default:
        return 'payment.unknown';
    }
  }
}
