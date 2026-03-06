import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { PaymentCompletedEvent } from '../../api/dto/transfer/payment-completed-event.dto';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { AccountType } from '@lumio/modules/payments/constants/payments-constans';
import { AppLoggerService } from '@libs/logger/logger.service';

export class HandlePaymentCompletedCommand {
  constructor(public readonly data: PaymentCompletedEvent) {}
}

@CommandHandler(HandlePaymentCompletedCommand)
export class HandlePaymentCompletedCommandHandler implements ICommandHandler<HandlePaymentCompletedCommand> {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly userRepository: ExternalQueryUserAccountsRepository,
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(command: HandlePaymentCompletedCommand): Promise<void> {
    const {
      profileId,
      subscriptionId,
      subscriptionType,
      periodStart,
      periodEnd,
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
        const existingSubscription =
          await this.subscriptionRepository.findSubscriptionByProfileId(
            profileId,
          );

        if (existingSubscription) {
          await this.subscriptionRepository.updateSubscriptionWithNewPayment(
            profileId,
            subscriptionType,
            endDate,
            subscriptionId,
            tx,
          );
          this.logger.error(
            `Critical error: user already has active subscription. Profile: ${profileId}, Subscription: ${subscriptionId}`,
          );
        } else {
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
        }

        await this.userRepository.updateAccountType(
          profileId,
          AccountType.BUSINESS,
          tx,
        );
      });
    } catch (error) {
      this.logger.error(
        `Failed to process payment completion. Profile: ${profileId}, Subscription: ${subscriptionId}, Error: ${error.messages}`,
        error.stack,
        HandlePaymentCompletedCommand.name,
      );
      throw error;
    }
  }
}
