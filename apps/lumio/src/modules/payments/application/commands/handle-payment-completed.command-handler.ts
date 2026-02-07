import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';

export interface PaymentCompletedEvent {
  id: number;
  aggregateId: number;
  aggregateType: string;
  eventType: string;
  payload: {
    paymentId: string;
    profileId: number;
    amount: number;
    currency: string;
    subscriptionId: string;
    subscriptionType: string;
    periodStart: Date;
    periodEnd: Date;
    timestamp: string;
  };
  timestamp: Date;
}

export class HandlePaymentCompletedCommand {
  constructor(public readonly data: PaymentCompletedEvent) {}
}

@CommandHandler(HandlePaymentCompletedCommand)
export class HandlePaymentCompletedCommandHandler implements ICommandHandler<HandlePaymentCompletedCommand> {
  constructor(private readonly appLogger: AppLoggerService) {}

  async execute(command: HandlePaymentCompletedCommand): Promise<void> {
    try {
      // Логируем входящую команду и данные
      this.appLogger.debug(
        `Received command: HandlePaymentCompletedCommand`,
        'PaymentsRabbitMQ',
      );
      this.appLogger.debug(
        `Command data: ${JSON.stringify(command.data, null, 2)}`,
        'PaymentsRabbitMQ',
      );

      await this.processPaymentCompleted(command.data);
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
