import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionPaymentTransferDto } from '@libs/dto/transfer/subscription-payment.transfer.dto';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { PrismaService } from '@payments/prisma/prisma.service';
import { AppLoggerService } from '@libs/logger/logger.service';

export class SubscriptionCommand {
  constructor(public dto: SubscriptionPaymentTransferDto) {}
}

@CommandHandler(SubscriptionCommand)
export class SubscriptionCommandHandler implements ICommandHandler<
  SubscriptionCommand,
  string
> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly stripeAdapter: StripeAdapter,
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async execute({ dto }: SubscriptionCommand): Promise<string> {
    const lastSuccessfulPayment =
      await this.paymentsRepository.findLastSuccessfulPaymentByProfileId(
        dto.profileId,
      );

    let trialEndDate: number | undefined = undefined;

    if (
      lastSuccessfulPayment &&
      lastSuccessfulPayment.nextPaymentDate &&
      lastSuccessfulPayment.nextPaymentDate > new Date()
    ) {
      trialEndDate = Math.floor(
        lastSuccessfulPayment.nextPaymentDate.getTime() / 1000,
      );
    }

    // Этап 1: Транзакция для создания платежа в БД
    const payment = await this.prisma.$transaction(async (tx) => {
      return await this.paymentsRepository.createPaymentInTransaction(
        {
          paymentProvider: dto.paymentProvider,
          currency: dto.currency,
          amount: dto.amount,
          profileId: dto.profileId,
        },
        tx,
      );
    });

    try {
      // Этап 2: Создание Stripe сессии
      const session = await this.stripeAdapter.createPaymentSession(
        dto.subscriptionType,
        dto.amount,
        payment.id,
        dto.currency,
        trialEndDate,
      );

      // Этап 3: Транзакция для обновления URL в БД
      await this.prisma.$transaction(async (tx) => {
        await this.paymentsRepository.updatePaymentUrlInTransaction(
          payment.id,
          session.url,
          tx,
        );
      });

      return session.url;
    } catch (error) {
      // Compensating Transaction: Отмена уже созданного платежа
      await this.prisma.$transaction(async (tx) => {
        await this.paymentsRepository.cancelPaymentInTransaction(
          payment.id,
          tx,
        );
      });

      this.logger.error(
        `Failed to create Stripe session: ${error.message}`,
        error.stack,
        SubscriptionCommandHandler.name,
      );
    }
  }
}
