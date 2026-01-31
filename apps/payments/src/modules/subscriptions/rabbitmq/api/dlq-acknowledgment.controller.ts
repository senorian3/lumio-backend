import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { CommandBus } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { RabbitMQUtils } from '@libs/utils/rabbitmq.utils';
import { InputPaymentAcknowledgmentDto } from './input/payment-acknowledgment.input.dto';
import { HandleDLQAcknowledgmentCommand } from '../application/commands/handle-dlq-acknowledgment.command-handler';

@Controller('dlq-acknowledgment')
export class DlqAcknowledgmentController {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly commandBus: CommandBus,
  ) {}

  @EventPattern('dlq.acknowledgment')
  async handleDlqAcknowledgment(
    @Payload() data: InputPaymentAcknowledgmentDto,
    @Ctx() context: RmqContext,
  ) {
    try {
      // Execute the command handler
      await this.commandBus.execute(
        new HandleDLQAcknowledgmentCommand(data.messageId, data.details),
      );

      // Acknowledge the message to remove it from DLQ
      RabbitMQUtils.ackMessage(context);
    } catch (error) {
      this.appLogger.error(
        `Critical error processing DLQ acknowledgment for message ${data.messageId}: ${error.message}`,
        error.stack,
        'DlqAcknowledgment',
      );

      // In case of critical error, we still need to acknowledge the message
      // to prevent it from blocking the DLQ
      try {
        RabbitMQUtils.ackMessage(context);
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
