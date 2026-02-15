import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { CommandBus } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { HandlePaymentCompletedCommand } from '../application/commands/handle-payment-completed.command-handler';
import { HandleSubscriptionRecurringUpdatedCommand } from '../application/commands/handle-subscription-updated.command-handler';
import { HandleSubscriptionDeletedCommand } from '../application/commands/handle-subscription-deleted.command-handler';
import { IdempotencyService } from '../application/idempotency.service';
import { DlqNotificationService } from '../application/dlq-notification.service';

@Controller('payments-rabbitmq')
export class PaymentsRabbitMQController {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly commandBus: CommandBus,
    private readonly idempotencyService: IdempotencyService,
    private readonly dlqNotificationService: DlqNotificationService,
  ) {}

  @EventPattern('payment.test')
  async handleSomeText(@Payload() data: any) {
    console.log("Received 'payment.test' event:", data);
  }

  @EventPattern('payment.completed')
  async handlePaymentCompleted(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    // Извлекаем messageId из payload или свойств сообщения
    let messageId = originalMsg.properties.messageId;
    if (!messageId && data && typeof data === 'object' && data._messageId) {
      messageId = data._messageId;
    }
    if (!messageId) {
      messageId = `payment-${Date.now()}`;
    }

    try {
      // Idempotency check
      if (await this.idempotencyService.isMessageProcessed(messageId)) {
        channel.ack(originalMsg);
        this.appLogger.log(
          `Duplicate payment message ignored: ${messageId}`,
          'Idempotency',
        );
        return;
      }

      // Execute the command handler
      await this.commandBus.execute(new HandlePaymentCompletedCommand(data));

      // Mark as processed
      await this.idempotencyService.markMessageAsProcessed(messageId);

      // Confirm successful processing
      channel.ack(originalMsg);
      this.appLogger.log(
        `Payment completed message processed successfully: ${messageId}`,
        'PaymentsRabbitMQ',
      );
    } catch (error) {
      this.appLogger.error(
        `Error processing payment completed message ${messageId}: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );

      // Извлекаем retryCount из payload или headers
      let retryCount = originalMsg.properties.headers?.['x-retry-count'] || 0;
      if (
        !retryCount &&
        data &&
        typeof data === 'object' &&
        data._retryCount !== undefined
      ) {
        retryCount = data._retryCount;
      }

      const maxRetries = 3;

      if (retryCount >= maxRetries) {
        // Send to DLQ
        channel.nack(originalMsg, false, false);

        // DLQ Notification
        await this.dlqNotificationService.sendNotification(
          messageId,
          'payment.completed',
          error.message,
          retryCount,
        );

        this.appLogger.warn(
          `Payment message ${messageId} sent to DLQ after ${retryCount} retries`,
          'PaymentsRabbitMQ',
        );
      } else {
        // Increment retry count and requeue
        if (!originalMsg.properties.headers) {
          originalMsg.properties.headers = {};
        }
        originalMsg.properties.headers['x-retry-count'] = retryCount + 1;
        channel.nack(originalMsg, false, true);
        this.appLogger.warn(
          `Payment message ${messageId} requeued for retry ${retryCount + 1}/${maxRetries}`,
          'PaymentsRabbitMQ',
        );
      }
    }
  }

  @EventPattern('payment.recurring.completed')
  async handleSubscriptionUpdated(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    // Извлекаем messageId из payload или свойств сообщения
    let messageId = originalMsg.properties.messageId;
    if (!messageId && data && typeof data === 'object' && data._messageId) {
      messageId = data._messageId;
    }
    if (!messageId) {
      messageId = `subscription-updated-${Date.now()}`;
    }

    try {
      // Idempotency check
      if (await this.idempotencyService.isMessageProcessed(messageId)) {
        channel.ack(originalMsg);
        this.appLogger.log(
          `Duplicate subscription updated message ignored: ${messageId}`,
          'Idempotency',
        );
        return;
      }

      // Execute the command handler
      await this.commandBus.execute(
        new HandleSubscriptionRecurringUpdatedCommand(data),
      );

      // Mark as processed
      await this.idempotencyService.markMessageAsProcessed(messageId);

      // Confirm successful processing
      channel.ack(originalMsg);
      this.appLogger.log(
        `Subscription updated message processed successfully: ${messageId}`,
        'PaymentsRabbitMQ',
      );
    } catch (error) {
      this.appLogger.error(
        `Error processing subscription updated message ${messageId}: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );

      // Извлекаем retryCount из payload или headers
      let retryCount = originalMsg.properties.headers?.['x-retry-count'] || 0;
      if (
        !retryCount &&
        data &&
        typeof data === 'object' &&
        data._retryCount !== undefined
      ) {
        retryCount = data._retryCount;
      }

      const maxRetries = 3;

      if (retryCount >= maxRetries) {
        // Send to DLQ
        channel.nack(originalMsg, false, false);

        // DLQ Notification
        await this.dlqNotificationService.sendNotification(
          messageId,
          'subscription.updated',
          error.message,
          retryCount,
        );

        this.appLogger.warn(
          `Subscription updated message ${messageId} sent to DLQ after ${retryCount} retries`,
          'PaymentsRabbitMQ',
        );
      } else {
        // Increment retry count and requeue
        if (!originalMsg.properties.headers) {
          originalMsg.properties.headers = {};
        }
        originalMsg.properties.headers['x-retry-count'] = retryCount + 1;
        channel.nack(originalMsg, false, true);
        this.appLogger.warn(
          `Subscription updated message ${messageId} requeued for retry ${retryCount + 1}/${maxRetries}`,
          'PaymentsRabbitMQ',
        );
      }
    }
  }

  @EventPattern('subscription.deleted')
  async handleSubscriptionDeleted(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    // Extract messageId from payload or message properties
    let messageId = originalMsg.properties.messageId;
    if (!messageId && data && typeof data === 'object' && data._messageId) {
      messageId = data._messageId;
    }
    if (!messageId) {
      messageId = `subscription-deleted-${Date.now()}`;
    }

    try {
      // Idempotency check
      if (await this.idempotencyService.isMessageProcessed(messageId)) {
        channel.ack(originalMsg);
        this.appLogger.log(
          `Duplicate subscription deleted message ignored: ${messageId}`,
          'Idempotency',
        );
        return;
      }

      // Execute the command handler
      await this.commandBus.execute(new HandleSubscriptionDeletedCommand(data));

      // Mark as processed
      await this.idempotencyService.markMessageAsProcessed(messageId);

      // Confirm successful processing
      channel.ack(originalMsg);
      this.appLogger.log(
        `Subscription deleted message processed successfully: ${messageId}`,
        'PaymentsRabbitMQ',
      );
    } catch (error) {
      this.appLogger.error(
        `Error processing subscription deleted message ${messageId}: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );

      // Extract retryCount from payload or headers
      let retryCount = originalMsg.properties.headers?.['x-retry-count'] || 0;
      if (
        !retryCount &&
        data &&
        typeof data === 'object' &&
        data._retryCount !== undefined
      ) {
        retryCount = data._retryCount;
      }

      const maxRetries = 3;

      if (retryCount >= maxRetries) {
        // Send to DLQ
        channel.nack(originalMsg, false, false);

        // DLQ Notification
        await this.dlqNotificationService.sendNotification(
          messageId,
          'subscription.deleted',
          error.message,
          retryCount,
        );

        this.appLogger.warn(
          `Subscription deleted message ${messageId} sent to DLQ after ${retryCount} retries`,
          'PaymentsRabbitMQ',
        );
      } else {
        // Increment retry count and requeue
        if (!originalMsg.properties.headers) {
          originalMsg.properties.headers = {};
        }
        originalMsg.properties.headers['x-retry-count'] = retryCount + 1;
        channel.nack(originalMsg, false, true);
        this.appLogger.warn(
          `Subscription deleted message ${messageId} requeued for retry ${retryCount + 1}/${maxRetries}`,
          'PaymentsRabbitMQ',
        );
      }
    }
  }
}
