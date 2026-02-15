import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { HandlePaymentCompletedCommand } from '../application/commands/handle-payment-completed.command-handler';
import { HandleSubscriptionRecurringUpdatedCommand } from '../application/commands/handle-subscription-updated.command-handler';
import { HandleSubscriptionDeletedCommand } from '../application/commands/handle-subscription-deleted.command-handler';
import { MessageProcessingService } from '../application/message-processing.service';

@Controller('payments-rabbitmq')
export class PaymentsRabbitMQController {
  constructor(
    private readonly messageProcessingService: MessageProcessingService,
  ) {}

  @EventPattern('payment.completed')
  async handlePaymentCompleted(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    await this.messageProcessingService.processMessage(
      'payment.completed',
      data,
      context,
      new HandlePaymentCompletedCommand(data),
      'payment',
    );
  }

  @EventPattern('payment.recurring.completed')
  async handleSubscriptionUpdated(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    await this.messageProcessingService.processMessage(
      'subscription.updated',
      data,
      context,
      new HandleSubscriptionRecurringUpdatedCommand(data),
      'subscription-updated',
    );
  }

  @EventPattern('subscription.deleted')
  async handleSubscriptionDeleted(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ) {
    await this.messageProcessingService.processMessage(
      'subscription.deleted',
      data,
      context,
      new HandleSubscriptionDeletedCommand(data),
      'subscription-deleted',
    );
  }
}
