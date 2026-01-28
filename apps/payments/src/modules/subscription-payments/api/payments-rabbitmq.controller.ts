import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxRepository } from '../domain/infrastructure/outbox.repository';

export interface PaymentAcknowledgment {
  messageId: number;
  paymentId: number;
  status: 'received' | 'processed';
  timestamp: Date;
  details?: string;
}

@Controller('payments-rabbitmq')
export class PaymentsRabbitMQController {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  @EventPattern('payment.acknowledgment')
  async handlePaymentAcknowledgment(
    @Payload() data: PaymentAcknowledgment,
    @Ctx() context: RmqContext,
  ) {
    try {
      // Find the outbox message
      const outboxMessage = await this.outboxRepository.findMessageById(
        data.messageId,
      );

      if (!outboxMessage) {
        this.appLogger.warn(
          `Outbox message ${data.messageId} not found for acknowledgment`,
          'PaymentsRabbitMQ',
        );

        // Acknowledge the message to remove it from the queue
        const channel = context.getChannelRef();
        const originalMessage = context.getMessage();
        channel.ack(originalMessage);

        return;
      }

      // Check if the message is already completed to avoid duplicate processing
      if (outboxMessage.status === 'completed') {
        // Acknowledge the message to remove it from the queue
        const channel = context.getChannelRef();
        const originalMessage = context.getMessage();
        channel.ack(originalMessage);

        return;
      }

      // Mark the outbox message as completed since Lumio has received and processed it
      await this.outboxRepository.markAsCompleted(data.messageId);

      // Acknowledge the message
      const channel = context.getChannelRef();
      const originalMessage = context.getMessage();
      channel.ack(originalMessage);
    } catch (error) {
      this.appLogger.error(
        `Error processing acknowledgment for message ${data.messageId}: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );

      // Re-throw the error to trigger DLX mechanism
      throw error;
    }
  }
}
