import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InputSubscriptionRecurringUpdatedEvent } from '../../api/dto/transfer/subscription-recurring-updated-event.dto';
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
      command.data.payload.subscriptionId,
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
        await this.paymentsRepository.createPayment(
          {
            id: data.payload.paymentId,
            amount: data.payload.amount,
            paymentsService: data.payload.paymentService,
            currency: data.payload.currency,
            subscriptionId: subscription.id,
          },
          tx,
        );

        await this.subscriptionRepository.updateSubscriptionWithNewPayment(
          subscription.id,
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
