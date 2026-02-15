import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RmqContext } from '@nestjs/microservices';
import { AppLoggerService } from '@libs/logger/logger.service';
import { IdempotencyService } from './idempotency.service';
import { DlqNotificationService } from './dlq-notification.service';

@Injectable()
export class MessageProcessingService {
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: AppLoggerService,
    private readonly idempotencyService: IdempotencyService,
    private readonly dlqNotificationService: DlqNotificationService,
  ) {}

  async processMessage(
    eventName: string,
    data: any,
    context: RmqContext,
    command: any,
    messageIdPrefix: string,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    let messageId = originalMsg.properties.messageId;
    if (!messageId && data && typeof data === 'object' && data._messageId) {
      messageId = data._messageId;
    }
    if (!messageId) {
      messageId = `${messageIdPrefix}-${Date.now()}`;
    }

    try {
      const isNewMessage =
        await this.idempotencyService.tryMarkAsProcessed(messageId);

      if (!isNewMessage) {
        channel.ack(originalMsg);
        this.logger.log(
          `Duplicate ${eventName} message ignored: ${messageId}`,
          MessageProcessingService.name,
        );
        return;
      }

      await this.commandBus.execute(command);

      channel.ack(originalMsg);
      this.logger.log(
        `${eventName} message processed successfully: ${messageId}`,
        MessageProcessingService.name,
      );
    } catch (error) {
      this.logger.error(
        `Error processing ${eventName} message ${messageId}: ${error.message}`,
        error.stack,
        MessageProcessingService.name,
      );

      let retryCount = originalMsg.properties.headers?.['x-retry-count'] || 0;
      if (
        !retryCount &&
        data &&
        typeof data === 'object' &&
        data._retryCount !== undefined
      ) {
        retryCount = data._retryCount;
      }

      if (retryCount >= this.MAX_RETRIES) {
        channel.nack(originalMsg, false, false);

        await this.dlqNotificationService.sendNotification(
          messageId,
          eventName,
          error.message,
          retryCount,
        );
      } else {
        if (!originalMsg.properties.headers) {
          originalMsg.properties.headers = {};
        }
        originalMsg.properties.headers['x-retry-count'] = retryCount + 1;
        channel.nack(originalMsg, false, true);
      }
    }
  }
}
