import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionRecurringUpdatedEvent } from '../../api/dto/transfer/subscription-recurring-updated-event.dto';
import { SubscriptionRepository } from '../../domain/infrastructure/subscription.repository';
import { PaymentsRepository } from '../../domain/infrastructure/payments.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

export class HandleSubscriptionRecurringUpdatedCommand {
  constructor(public readonly data: SubscriptionRecurringUpdatedEvent) {}
}

@CommandHandler(HandleSubscriptionRecurringUpdatedCommand)
export class HandleSubscriptionRecurringUpdatedCommandHandler implements ICommandHandler<HandleSubscriptionRecurringUpdatedCommand> {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    command: HandleSubscriptionRecurringUpdatedCommand,
  ): Promise<void> {
    const data = command.data;

    const subscription =
      await this.subscriptionRepository.findActiveSubscriptionByProfileId(
        data.payload.profileId,
      );

    if (!subscription) {
      return;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const datePayment = new Date();
        await this.paymentsRepository.createPayment(
          {
            id: data.payload.paymentId,
            amount: data.payload.amount,
            paymentsService: data.payload.paymentService,
            currency: data.payload.currency,
            subscriptionId: subscription.id,
            datePayment: datePayment,
            endDate: data.payload.nextPaymentDate,
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
      throw error;
    }
  }
}
