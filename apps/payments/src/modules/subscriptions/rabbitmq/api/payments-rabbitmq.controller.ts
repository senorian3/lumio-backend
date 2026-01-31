import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { CommandBus } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { HandlePaymentAcknowledgmentCommand } from '../application/commands/handle-payment-acknowledgment.command-handler';
import { RabbitMQUtils } from '@libs/utils/rabbitmq.utils';
import { InputPaymentAcknowledgmentDto } from '@payments/modules/subscriptions/rabbitmq/api/dto/input/payment-acknowledgment.input.dto';

@Controller('payments-rabbitmq')
export class PaymentsRabbitMQController {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly commandBus: CommandBus,
  ) {}

  @EventPattern('payment.acknowledgment')
  async handlePaymentAcknowledgment(
    @Payload() data: InputPaymentAcknowledgmentDto,
    @Ctx() context: RmqContext,
  ) {
    try {
      // Execute the command handler
      await this.commandBus.execute(
        new HandlePaymentAcknowledgmentCommand(data.messageId, data.status),
      );

      // Acknowledge the message
      RabbitMQUtils.ackMessage(context);
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
