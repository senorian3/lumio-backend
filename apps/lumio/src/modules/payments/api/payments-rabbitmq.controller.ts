import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CommandBus } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { HandlePaymentCompletedCommand } from '../application/commands/handle-payment-completed.command-handler';
import { HandleSubscriptionCancelledCommand } from '../application/commands/handle-subscription-cancelled.command-handler';
import { HandleSubscriptionUpdatedCommand } from '../application/commands/handle-subscription-updated.command-handler';
import { InputSubscriptionCancelledDto } from './dto/input/subscription-cancelled.input.dto';
import { InputSubscriptionUpdatedDto } from './dto/input/subscription-updated.input.dto';
import { InputPaymentCompletedDto } from './dto/input/payment-completed.input.dto';

@Controller('payments-rabbitmq')
export class PaymentsRabbitMQController {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly commandBus: CommandBus,
  ) {}

  @EventPattern('payment.completed')
  async handlePaymentCompleted(@Payload() data: InputPaymentCompletedDto) {
    console.log('data', data);
    try {
      // Execute the command handler
      await this.commandBus.execute(new HandlePaymentCompletedCommand(data));
    } catch (error) {
      this.appLogger.error(
        `Error processing payment completed event: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );
      throw error; // This will cause the message to be retried
    }
  }

  @EventPattern('subscription.cancelled')
  async handleSubscriptionCancelled(
    @Payload() data: InputSubscriptionCancelledDto,
  ) {
    try {
      // Execute the command handler
      await this.commandBus.execute(
        new HandleSubscriptionCancelledCommand(data),
      );
    } catch (error) {
      this.appLogger.error(
        `Error processing subscription cancelled event: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );
      throw error; // This will cause the message to be retried
    }
  }

  @EventPattern('subscription.updated')
  async handleSubscriptionUpdated(
    @Payload() data: InputSubscriptionUpdatedDto,
  ) {
    try {
      // Execute the command handler
      await this.commandBus.execute(new HandleSubscriptionUpdatedCommand(data));
    } catch (error) {
      this.appLogger.error(
        `Error processing subscription updated event: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );
      throw error; // This will cause the message to be retried
    }
  }
}

//todo добавитть subscription.cancel
