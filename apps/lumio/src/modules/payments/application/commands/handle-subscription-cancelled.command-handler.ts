import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PaymentsAcknowledgmentService } from '../payments-acknowledgment.service';

export interface SubscriptionCancelledEvent {
  id: number;
  aggregateId: number;
  aggregateType: string;
  eventType: string;
  payload: {
    paymentId: number;
    subscriptionId: string;
    timestamp: string;
  };
  timestamp: Date;
}

export class HandleSubscriptionCancelledCommand {
  constructor(public readonly data: SubscriptionCancelledEvent) {}
}

@CommandHandler(HandleSubscriptionCancelledCommand)
export class HandleSubscriptionCancelledCommandHandler implements ICommandHandler<HandleSubscriptionCancelledCommand> {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly acknowledgmentService: PaymentsAcknowledgmentService,
  ) {}

  async execute(command: HandleSubscriptionCancelledCommand): Promise<void> {
    try {
      // Process the subscription cancellation
      await this.processSubscriptionCancelled(command.data);

      // Send acknowledgment to Payments service
      await this.acknowledgmentService.sendSubscriptionCancelledAcknowledgment(
        command.data.id,
      );

      this.appLogger.log(
        `Successfully processed subscription cancelled event: ${command.data.payload.paymentId}`,
        'PaymentsRabbitMQ',
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

  private async processSubscriptionCancelled(
    data: SubscriptionCancelledEvent,
  ): Promise<void> {
    // TODO: Implement actual subscription cancellation processing logic
    // This would typically involve:
    // 1. Updating the user's subscription status
    // 2. Marking the subscription as cancelled
    // 3. Sending acknowledgment back to Payments service

    this.appLogger.log(
      `Processing subscription cancelled for payment ${data.payload.paymentId}`,
      'PaymentsRabbitMQ',
    );

    // For now, just log the data
    this.appLogger.log(
      `Subscription cancellation data: ${JSON.stringify(data.payload)}`,
      'PaymentsRabbitMQ',
    );
  }
}
