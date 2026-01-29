import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxRepository, OutboxEventType } from './outbox.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ExternalCallsProcessor } from './external-calls.processor';

@Injectable()
export class OutboxScheduler {
  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly logger: AppLoggerService,
    @Inject('LUMIO_SERVICE') private readonly lumioService: ClientProxy,
    private readonly externalCallsProcessor: ExternalCallsProcessor,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxMessages(): Promise<void> {
    try {
      const messages = await this.outboxRepository.findPendingMessages(10);

      if (messages.length === 0) {
        return;
      }

      this.logger.log(
        `Processing ${messages.length} outbox messages`,
        'OutboxScheduler',
      );

      for (const message of messages) {
        try {
          await this.outboxRepository.markAsProcessing(message.id);

          let result: boolean;

          // Обработка в зависимости от типа события
          switch (message.eventType) {
            case OutboxEventType.CANCEL_SUBSCRIPTION:
              result =
                await this.externalCallsProcessor.processCancelSubscription(
                  message,
                );
              break;

            case OutboxEventType.PAYMENT_COMPLETED:
            case OutboxEventType.PAYMENT_FAILED:
            case OutboxEventType.SUBSCRIPTION_CANCELLED:
              result = await this.sendMessageToLumio(message);
              break;

            default:
              this.logger.warn(
                `Unknown outbox event type: ${message.eventType}`,
                'OutboxScheduler',
              );
              result = false;
          }

          if (result) {
            await this.outboxRepository.markAsCompleted(message.id);
          } else {
            await this.outboxRepository.incrementRetryCount(message.id);
            this.logger.warn(
              `Failed to process outbox message ${message.id} (${message.eventType}), will retry`,
              'OutboxScheduler',
            );
          }
        } catch (error) {
          this.logger.error(
            `Error processing outbox message ${message.id}: ${error.message}`,
            error.stack,
            'OutboxScheduler',
          );
          await this.outboxRepository.incrementRetryCount(message.id);
        }
      }
    } catch (error) {
      this.logger.error(
        `Critical error in outbox scheduler: ${error.message}`,
        error.stack,
        'OutboxScheduler',
      );
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredMessages(): Promise<void> {
    try {
      await this.outboxRepository.cleanupExpiredMessages();
      this.logger.log('Cleaned up expired outbox messages', 'OutboxScheduler');
    } catch (error) {
      this.logger.error(
        `Error cleaning up expired messages: ${error.message}`,
        error.stack,
        'OutboxScheduler',
      );
    }
  }

  private async sendMessageToLumio(message: any): Promise<boolean> {
    try {
      const routingKey = this.getRoutingKey(message.eventType);

      await lastValueFrom(
        this.lumioService.emit(routingKey, {
          id: message.id,
          aggregateId: message.aggregateId,
          aggregateType: message.aggregateType,
          eventType: message.eventType,
          payload: message.payload,
          timestamp: message.createdAt,
        }),
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send message to Lumio: ${error.message}`,
        error.stack,
        'OutboxScheduler',
      );
      return false;
    }
  }

  private getRoutingKey(eventType: string): string {
    switch (eventType) {
      case OutboxEventType.PAYMENT_COMPLETED:
        return 'payment.completed';
      case OutboxEventType.PAYMENT_FAILED:
        return 'payment.failed';
      case OutboxEventType.SUBSCRIPTION_CANCELLED:
        return 'subscription.cancelled';
      default:
        return 'payment.unknown';
    }
  }
}
