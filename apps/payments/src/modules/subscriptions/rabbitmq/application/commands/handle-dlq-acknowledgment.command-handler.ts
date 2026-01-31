import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxRepository } from '../../../outbox/domain/outbox.repository';

export class HandleDLQAcknowledgmentCommand {
  constructor(
    public readonly messageId: number,
    public readonly details: string,
  ) {}
}

@CommandHandler(HandleDLQAcknowledgmentCommand)
export class HandleDLQAcknowledgmentCommandHandler implements ICommandHandler<HandleDLQAcknowledgmentCommand> {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  async execute(command: HandleDLQAcknowledgmentCommand): Promise<void> {
    try {
      // Find the outbox message
      const outboxMessage = await this.outboxRepository.findMessageById(
        command.messageId,
      );

      if (!outboxMessage) {
        this.appLogger.warn(
          `Outbox message ${command.messageId} not found for DLQ acknowledgment`,
          'DlqAcknowledgment',
        );
        return;
      }

      // Check if the message is already completed
      if (outboxMessage.status === 'completed') {
        return;
      }

      // Mark the outbox message as completed since Lumio has sent acknowledgment
      // This means the message was actually processed successfully by Lumio
      await this.outboxRepository.markAsCompleted(
        command.messageId,
        command.details,
        new Date(),
      );

      this.appLogger.log(
        `Successfully processed DLQ acknowledgment for message ${command.messageId}`,
        'DlqAcknowledgment',
      );
    } catch (error) {
      this.appLogger.error(
        `Error processing DLQ acknowledgment for message ${command.messageId}: ${error.message}`,
        error.stack,
        'DlqAcknowledgment',
      );
      throw error;
    }
  }
}
