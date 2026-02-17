import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import { PaymentsRepository } from '@lumio/modules/payments/domain/infrastructure/payments.repository';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { PaymentCompletedEvent } from '../../api/dto/transfer/payment-completed-event.dto';
import { PrismaService } from '@lumio/prisma/prisma.service';

export class HandlePaymentCompletedCommand {
  constructor(public readonly data: PaymentCompletedEvent) {}
}

@CommandHandler(HandlePaymentCompletedCommand)
export class HandlePaymentCompletedCommandHandler implements ICommandHandler<HandlePaymentCompletedCommand> {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly userRepository: ExternalQueryUserAccountsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: HandlePaymentCompletedCommand): Promise<void> {
    const {
      profileId,
      amount,
      currency,
      subscriptionId,
      subscriptionType,
      periodStart,
      periodEnd,
      paymentsService,
    } = command.data.payload;

    const profile = await this.userRepository.getProfileById(profileId);

    if (!profile) {
      throw NotFoundDomainException.create(
        'User profile dont exist',
        'profileId',
      );
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    try {
      await this.prisma.$transaction(async (tx) => {
        const subscription =
          await this.subscriptionRepository.createSubscription(
            {
              subscriptionId,
              durationType: subscriptionType,
              startDate,
              endDate,
              userProfileId: profileId,
              autoRenewal: true,
            },
            tx,
          );

        await this.paymentsRepository.createPayment(
          {
            id: command.data.payload.paymentId,
            amount,
            currency,
            paymentsService: paymentsService,
            subscriptionId: subscription.id,
            datePayment: startDate,
            endDate: endDate,
          },
          tx,
        );

        await this.userRepository.updateAccountType(profileId, 'Business', tx);
      });
    } catch (error) {
      throw error;
    }
  }
}
