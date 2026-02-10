import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChangeAutoRenewalSubscriptionTransferDto } from '@libs/dto/transfer/change-autorenewal-subscription.transfer.dto';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
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
      await this.paymentsRepository.findActiveSubscriptionByProfileId(
        +dto.profileId,
      );

    if (!activeSubscription || !activeSubscription.subscriptionType) {
      throw BadRequestDomainException.create(
        "User doesn't have active subscription",
        'autoRenewalSubscription',
      );
    }

    if (activeSubscription.autoRenewal === dto.autoRenewal) {
      return;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.paymentsRepository.updatePaymentAutoRenewal(
          activeSubscription.subscriptionId,
          activeSubscription.customPaymentId,
          dto.autoRenewal,
          tx,
        );

        await this.outboxService.createChangeSubscriptionAutoRenewalStripe(
          activeSubscription.subscriptionId,
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

      throw BadRequestDomainException.create(
        `Failed to change autoRenewal subscription for profileId ${dto.profileId}`,
        'profileId',
      );
    }
  }
}
