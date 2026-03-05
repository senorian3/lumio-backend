import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChangeAutoRenewalSubscriptionTransferDto } from '@libs/dto/transfer/change-autorenewal-subscription.transfer.dto';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PrismaService } from '@payments/prisma/prisma.service';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';

export class ChangeAutoRenewalSubscriptionCommand {
  constructor(public dto: ChangeAutoRenewalSubscriptionTransferDto) {}
}

@CommandHandler(ChangeAutoRenewalSubscriptionCommand)
export class ChangeAutoRenewalSubscriptionCommandHandler implements ICommandHandler<
  ChangeAutoRenewalSubscriptionCommand,
  void
> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly logger: AppLoggerService,
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
  ) {}

  async execute({ dto }: ChangeAutoRenewalSubscriptionCommand): Promise<void> {
    const activeSubscription =
      await this.paymentsRepository.findActiveOrExtensionSubscriptionPaymentByProfileId(
        +dto.profileId,
      );

    const mainSubscription = activeSubscription.mainSubscriptionId
      ? await this.paymentsRepository.findBySubscriptionId(
          activeSubscription.mainSubscriptionId,
        )
      : null;

    if (!activeSubscription || !activeSubscription.subscriptionType) {
      throw NotFoundDomainException.create(
        "User doesn't have active subscription",
        'profileId',
      );
    }

    if (activeSubscription.autoRenewal === dto.autoRenewal) {
      return;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.paymentsRepository.updatePaymentSubscriptiAutoRenewal(
          mainSubscription.subscriptionId,
          mainSubscription.customPaymentId,
          dto.autoRenewal,
          tx,
        );

        await this.outboxService.createChangeSubscriptionAutoRenewalStripe(
          activeSubscription.stripeSubscriptionId,
          dto.autoRenewal,
          tx,
        );
      });
    } catch (error) {
      this.logger.error(
        `Failed to change autoRenewal subscription for profileId ${dto.profileId}: ${error.message}`,
        error.stack,
        ChangeAutoRenewalSubscriptionCommandHandler.name,
      );

      throw error;
    }
  }
}
