import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CancelSubscriptionTransferDto } from '@libs/dto/transfer/cancel-subscription.transfer.dto';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PrismaService } from '@payments/prisma/prisma.service';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';

export class CancelSubscriptionCommand {
  constructor(public dto: CancelSubscriptionTransferDto) {}
}

@CommandHandler(CancelSubscriptionCommand)
export class CancelSubscriptionCommandHandler implements ICommandHandler<
  CancelSubscriptionCommand,
  void
> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly logger: AppLoggerService,
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
  ) {}

  async execute({ dto }: CancelSubscriptionCommand): Promise<void> {
    // Находим активную подписку пользователя
    const activeSubscription =
      await this.paymentsRepository.findActiveSubscriptionByProfileId(
        +dto.profileId,
      );

    if (!activeSubscription) {
      throw BadRequestDomainException.create(
        "User doesn't have active subscription",
        'cancelSubscription',
      );
    }

    // Проверяем, есть ли subscriptionId
    if (!activeSubscription.subscriptionId) {
      throw BadRequestDomainException.create(
        "Subscription doesn't have subscriptionId",
        'cancelSubscription',
      );
    }

    // Вся логика в одной транзакции: обновление БД + создание outbox сообщений
    await this.prisma.$transaction(async (tx) => {
      // 1. Обновляем запись в БД - отключаем автообновление
      await this.paymentsRepository.updatePaymentAutoRenewal(
        activeSubscription.subscriptionId,
        activeSubscription.customPaymentId,
        false, // autoRenewal: false
        tx,
      );

      // 2. Создаем сообщение в outbox для Lumio (уведомление об отмене)
      await this.outboxService.createSubscriptionCancelByUserMessage(
        activeSubscription.customPaymentId,
        activeSubscription.subscriptionId,
        tx,
      );

      // 3. Создаем сообщение в outbox для Stripe (отключение автопродления)
      await this.outboxService.createCancelSubscriptionAutoRenewalMessage(
        activeSubscription.subscriptionId,
        activeSubscription.customPaymentId,
        tx,
      );
    });

    this.logger.log(
      `Автообновление подписки отключено для profileId=${dto.profileId}, subscriptionId=${activeSubscription.subscriptionId}`,
      CancelSubscriptionCommandHandler.name,
    );
  }
}
