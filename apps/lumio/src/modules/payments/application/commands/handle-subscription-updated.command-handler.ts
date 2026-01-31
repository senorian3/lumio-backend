import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PaymentsAcknowledgmentService } from '../payments-acknowledgment.service';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateSubscriptionPeriodCommand } from './update-subscription-period.command-handler';

export interface SubscriptionUpdatedEvent {
  id: number;
  aggregateId: number;
  aggregateType: string;
  eventType: string;
  payload: {
    paymentId: number;
    subscriptionId: number;
    periodEnd: Date;
    nextPaymentDate: Date;
    timestamp: string;
  };
  timestamp: Date;
}

export class HandleSubscriptionUpdatedCommand {
  constructor(public readonly data: SubscriptionUpdatedEvent) {}
}

@CommandHandler(HandleSubscriptionUpdatedCommand)
export class HandleSubscriptionUpdatedCommandHandler implements ICommandHandler<HandleSubscriptionUpdatedCommand> {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly acknowledgmentService: PaymentsAcknowledgmentService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: HandleSubscriptionUpdatedCommand): Promise<void> {
    try {
      // Process the subscription update
      await this.processSubscriptionUpdated(command.data);

      // Send acknowledgment to Payments service
      await this.acknowledgmentService.sendSubscriptionUpdatedAcknowledgment(
        command.data.id,
      );

      this.appLogger.log(
        `Successfully processed subscription updated event: ${command.data.payload.paymentId}`,
        'PaymentsRabbitMQ',
      );
    } catch (error) {
      this.appLogger.error(
        `Error processing subscription updated event: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );
      throw error; // This will cause the message to be retried
    }
  }

  private async processSubscriptionUpdated(
    data: SubscriptionUpdatedEvent,
  ): Promise<void> {
    // Update the existing subscription's periodEnd and nextPaymentDate
    await this.commandBus.execute(
      new UpdateSubscriptionPeriodCommand(
        data.payload.paymentId,
        data.payload.subscriptionId,
        data.payload.periodEnd,
        data.payload.nextPaymentDate,
      ),
    );

    this.appLogger.log(
      `Successfully updated subscription for payment ${data.payload.paymentId}`,
      'PaymentsRabbitMQ',
    );
  }
}
