import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxRepository } from '../../../outbox/domain/outbox.repository';

export class HandlePaymentAcknowledgmentCommand {
  constructor(
    public readonly messageId: number,
    public readonly status: 'received' | 'processed',
  ) {}
}

@CommandHandler(HandlePaymentAcknowledgmentCommand)
export class HandlePaymentAcknowledgmentCommandHandler implements ICommandHandler<HandlePaymentAcknowledgmentCommand> {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  async execute(command: HandlePaymentAcknowledgmentCommand): Promise<void> {
    try {
      // Find the outbox message
      const outboxMessage = await this.outboxRepository.findMessageById(
        command.messageId,
      );

      if (!outboxMessage) {
        this.appLogger.warn(
          `Outbox message ${command.messageId} not found for acknowledgment`,
          'PaymentsRabbitMQ',
        );
        return;
      }

      // Check if the message is already completed to avoid duplicate processing
      if (outboxMessage.status === 'completed') {
        return;
      }

      // Mark the outbox message as completed since Lumio has received and processed it
      await this.outboxRepository.markAsCompleted(
        command.messageId,
        'Acknowledgment received from Lumio',
        new Date(),
      );

      this.appLogger.log(
        `Successfully processed acknowledgment for message ${command.messageId}`,
        'PaymentsRabbitMQ',
      );
    } catch (error) {
      this.appLogger.error(
        `Error processing acknowledgment for message ${command.messageId}: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );
      throw error;
    }
  }
}
