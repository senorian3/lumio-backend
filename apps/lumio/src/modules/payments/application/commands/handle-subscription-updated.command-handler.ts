import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InputSubscriptionRecurringUpdatedEvent } from '../../api/dto/input/subscription-recurring-updated-event.input.dto';
import { AppLoggerService } from '@libs/logger/logger.service';
import { SubscriptionRepository } from '../../domain/infrastructure/subscription.repository';
import { PaymentsRepository } from '../../domain/infrastructure/payments.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

export class HandleSubscriptionRecurringUpdatedCommand {
  constructor(public readonly data: InputSubscriptionRecurringUpdatedEvent) {}
}

@CommandHandler(HandleSubscriptionRecurringUpdatedCommand)
export class HandleSubscriptionRecurringUpdatedCommandHandler implements ICommandHandler<HandleSubscriptionRecurringUpdatedCommand> {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    command: HandleSubscriptionRecurringUpdatedCommand,
  ): Promise<void> {
    const data = command.data;

    const subscription = await this.subscriptionRepository.findSubscriptionById(
      +command.data.payload.subscriptionId,
    );

    if (!subscription) {
      this.appLogger.warn(
        `Subscription not found for payment ${data.payload.paymentId}`,
        'HandleSubscriptionUpdatedCommandHandler',
      );
      return;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const payment = await this.paymentsRepository.createPayment(
          {
            id: data.payload.paymentId,
            amount: data.payload.amount,
            paymentsService: data.payload.subscriptionType,
            currency: data.payload.currency,
            subscriptionId: +data.payload.subscriptionId,
          },
          tx,
        );

        await this.subscriptionRepository.updateSubscriptionWithNewPayment(
          +data.payload.subscriptionId,
          payment.id,
          subscription.durationType,
          data.payload.nextPaymentDate,
          subscription.autoRenewal,
          tx,
        );
      });
    } catch (error) {
      this.appLogger.error(
        `Error processing subscription updated event: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );
      throw error;
    }
  }
}
