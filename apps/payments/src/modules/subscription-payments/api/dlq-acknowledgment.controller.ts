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

@Controller('dlq-acknowledgment')
export class DlqAcknowledgmentController {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  @EventPattern('dlq.acknowledgment')
  async handleDlqAcknowledgment(
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
          `Outbox message ${data.messageId} not found for DLQ acknowledgment`,
          'DlqAcknowledgment',
        );

        // Acknowledge the message to remove it from DLQ
        const channel = context.getChannelRef();
        const originalMessage = context.getMessage();
        channel.ack(originalMessage);

        return;
      }

      // Check if the message is already completed
      if (outboxMessage.status === 'completed') {
        // Acknowledge the message to remove it from DLQ
        const channel = context.getChannelRef();
        const originalMessage = context.getMessage();
        channel.ack(originalMessage);

        return;
      }

      // Mark the outbox message as completed since Lumio has sent acknowledgment
      // This means the message was actually processed successfully by Lumio
      await this.outboxRepository.markAsCompleted(data.messageId);

      // Acknowledge the message to remove it from DLQ
      const channel = context.getChannelRef();
      const originalMessage = context.getMessage();
      channel.ack(originalMessage);
    } catch (error) {
      this.appLogger.error(
        `Critical error processing DLQ acknowledgment for message ${data.messageId}: ${error.message}`,
        error.stack,
        'DlqAcknowledgment',
      );

      // In case of critical error, we still need to acknowledge the message
      // to prevent it from blocking the DLQ
      try {
        const channel = context.getChannelRef();
        const originalMessage = context.getMessage();
        channel.ack(originalMessage);
      } catch (ackError) {
        this.appLogger.error(
          `Failed to acknowledge DLQ message ${data.messageId}: ${ackError.message}`,
          ackError.stack,
          'DlqAcknowledgment',
        );
      }

      // Re-throw the error to let the system know there was a problem
      throw error;
    }
  }
}
