import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PaymentsAcknowledgmentService } from '../payments-acknowledgment.service';
import { CommandBus } from '@nestjs/cqrs';

export interface PaymentCompletedEvent {
  id: number;
  aggregateId: number;
  aggregateType: string;
  eventType: string;
  payload: {
    paymentId: number;
    profileId: number;
    amount: number;
    currency: string;
    subscriptionId: string;
    subscriptionType: string;
    periodStart: Date;
    periodEnd: Date;
    nextPaymentDate: Date;
    timestamp: string;
  };
  timestamp: Date;
}

export class HandlePaymentCompletedCommand {
  constructor(public readonly data: PaymentCompletedEvent) {}
}

@CommandHandler(HandlePaymentCompletedCommand)
export class HandlePaymentCompletedCommandHandler implements ICommandHandler<HandlePaymentCompletedCommand> {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly acknowledgmentService: PaymentsAcknowledgmentService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: HandlePaymentCompletedCommand): Promise<void> {
    try {
      // Process the payment completion
      await this.processPaymentCompleted(command.data);

      // Send acknowledgment to Payments service
      await this.acknowledgmentService.sendPaymentCompletedAcknowledgment(
        command.data.id,
      );

      this.appLogger.log(
        `Successfully processed payment completed event: ${command.data.payload.paymentId}`,
        'PaymentsRabbitMQ',
      );
    } catch (error) {
      this.appLogger.error(
        `Error processing payment completed event: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );
      throw error; // This will cause the message to be retried
    }
  }

  private async processPaymentCompleted(
    data: PaymentCompletedEvent,
  ): Promise<void> {
    // TODO: Implement actual payment processing logic
    // This would typically involve:
    // 1. Updating the user's subscription status in the database
    // 2. Creating/updating the subscription entity
    // 3. Sending acknowledgment back to Payments service

    this.appLogger.log(
      `Processing payment completed for payment ${data.payload.paymentId}`,
      'PaymentsRabbitMQ',
    );

    // For now, just log the data
    this.appLogger.log(
      `Payment data: ${JSON.stringify(data.payload)}`,
      'PaymentsRabbitMQ',
    );
  }
}
