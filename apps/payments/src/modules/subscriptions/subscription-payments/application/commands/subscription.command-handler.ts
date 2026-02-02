import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionPaymentTransferDto } from '@libs/dto/transfer/subscription-payment.transfer.dto';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { PrismaService } from '@payments/prisma/prisma.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { CreatePaymentDomainDto } from '../../domain/dto/create-payment.domain.dto';

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
        parseInt(dto.profileId, 10),
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

    // Расчет суммы на основе типа подписки
    let amount: number;
    switch (dto.subscriptionType) {
      case '1 week':
        amount = 1;
        break;
      case '2 weeks':
        amount = 1.5;
        break;
      case '1 month':
        amount = 3;
        break;
      default:
        throw new Error(`Unknown subscription type: ${dto.subscriptionType}`);
    }

    // Этап 1: Транзакция для создания платежа в БД
    const payment = await this.prisma.$transaction(async (tx) => {
      const createDomainPymentData: CreatePaymentDomainDto = {
        paymentProvider: dto.paymentProvider,
        currency: dto.currency,
        amount: amount,
        profileId: parseInt(dto.profileId, 10),
        status: 'pending',
        subscriptionType: dto.subscriptionType,
        autoRenewal: true,
        subscriptionId: null,
        periodStart: null,
        periodEnd: null,
        nextPaymentDate: null,
        createdAt: new Date(),
        paymentsUrl: null,
        stripePaymentCreatedAt: null,
        cancelledAt: null,
      };

      return await this.paymentsRepository.createPayment(
        createDomainPymentData,
        tx,
      );
    });

    try {
      // Этап 2: Создание Stripe сессии
      const session = await this.stripeAdapter.createPaymentSession(
        dto.subscriptionType,
        amount,
        payment.id,
        dto.currency,
        trialEndDate,
      );

      // Этап 3: Транзакция для обновления URL в БД
      await this.prisma.$transaction(async (tx) => {
        await this.paymentsRepository.updatePaymentUrl(
          payment.id,
          session.url,
          tx,
        );
      });

      return session.url;
    } catch (error) {
      // Compensating Transaction: Отмена уже созданного платежа
      await this.prisma.$transaction(async (tx) => {
        await this.paymentsRepository.cancelPayment(payment.id, tx);
      });

      this.logger.error(
        `Failed to create Stripe session: ${error.message}`,
        error.stack,
        SubscriptionCommandHandler.name,
      );
    }
  }
}
