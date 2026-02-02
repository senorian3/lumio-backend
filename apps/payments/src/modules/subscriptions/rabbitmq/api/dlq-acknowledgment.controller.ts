import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CommandBus } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { InputPaymentAcknowledgmentDto } from '@payments/modules/subscriptions/rabbitmq/api/dto/input/payment-acknowledgment.input.dto';
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
  ) {
    try {
      // Execute the command handler
      await this.commandBus.execute(
        new HandleDLQAcknowledgmentCommand(data.messageId, data.details),
      );
    } catch (error) {
      this.appLogger.error(
        `Critical error processing DLQ acknowledgment for message ${data.messageId}: ${error.message}`,
        error.stack,
        'DlqAcknowledgment',
      );

      // Re-throw the error to let the system know there was a problem
      throw error;
    }
  }
}
