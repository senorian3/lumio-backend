import { Stripe } from 'stripe';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '../../domain/infrastructure/payments.repository';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { PaymentStatus } from '@payments/modules/subscriptions/constants/stripe-constants';
import { CreatePaymentDomainDto } from '../../domain/dto/create-payment.domain.dto';
import { CreateSubscriptionUpdateMessageDto } from '@payments/modules/subscriptions/outbox/application/dto/create-subscription-update-message';
import { RetryService } from '../retry.service';
import { ManualReviewService } from '../manual-review.service';
import { AppLoggerService } from '@libs/logger/logger.service';

export class ProcessRecurringPaymentCommand {
  constructor(public readonly invoice: Stripe.Invoice) {}
}

@CommandHandler(ProcessRecurringPaymentCommand)
export class ProcessRecurringPaymentCommandHandler implements ICommandHandler<
  ProcessRecurringPaymentCommand,
  void
> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly outboxService: OutboxService,
    private readonly prisma: PrismaService,
    private readonly retryService: RetryService,
    private readonly manualReviewService: ManualReviewService,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(command: ProcessRecurringPaymentCommand): Promise<void> {
    // try {
    //   await this.retryService.executeWithRetry(
    //     () => this.processRecurringPayment(command.invoice),
    //     { maxRetries: 5 },
    //   );
    // } catch (error) {
    //   await this.manualReviewService.createFailedRecurringPaymentTask(
    //     command.invoice,
    //     error,
    //   );
    // }

    await this.processRecurringPayment(command.invoice);
  }

  private async processRecurringPayment(invoice: Stripe.Invoice) {
    this.logger.log(
      `Начало обработки рекуррентного платежа: invoice=${invoice.id}, status=${invoice.status}, billing_reason=${invoice.billing_reason}`,
      ProcessRecurringPaymentCommandHandler.name,
    );

    if (
      invoice.billing_reason === 'subscription_create' ||
      invoice.status !== 'paid'
    ) {
      this.logger.log(
        `Пропуск обработки: invoice=${invoice.id}, billing_reason=${invoice.billing_reason}, status=${invoice.status}`,
        ProcessRecurringPaymentCommandHandler.name,
      );
      return;
    }

    // Ищем существующий платеж в БД для получения данных профиля и подписки
    await this.prisma.$transaction(async (tx) => {
      const subscriptionId = invoice.parent.subscription_details
        .subscription as string;

      const existingPayment =
        await this.paymentsRepository.findBySubscriptionId(subscriptionId, tx);

      if (!existingPayment) {
        this.logger.error(
          `Платеж не найден в БД: subscriptionId=${subscriptionId}`,
          ProcessRecurringPaymentCommandHandler.name,
        );
        throw Error;
      }

      const invoiceLine = invoice.lines.data[0];

      // Извлекаем данные из инвойса
      const amount = invoice.amount_paid / 100; // конвертируем из центов в основную валюту
      const currentPeriodStart = new Date(invoiceLine.period.start * 1000);
      const currentPeriodEnd = new Date(invoiceLine.period.end * 1000);
      const nextPaymentDate = currentPeriodEnd;
      const createdAt = new Date(invoice.created * 1000);

      // Определяем тип подписки из метаданных инвойса или существующего платежа
      const subscriptionType =
        invoice.metadata?.subscriptionType ||
        existingPayment.subscriptionType ||
        '1 month';

      const finishDate = new Date(Date.now());

      const createPaymentData: CreatePaymentDomainDto = {
        paymentProvider: 'Stripe',
        currency: invoice.currency.toUpperCase(),
        amount,
        profileId: existingPayment.profileId,
        status: PaymentStatus.SUCCESSFUL,
        subscriptionId: subscriptionId,
        periodStart: currentPeriodStart,
        periodEnd: currentPeriodEnd,
        nextPaymentDate: nextPaymentDate,
        subscriptionType: subscriptionType,
        autoRenewal: existingPayment.autoRenewal,
        paymentsUrl: 'AutoRenewal',
        createdAt: new Date(),
        stripePaymentCreatedAt: createdAt,
        cancelledAt: null,
        customPaymentId: `${existingPayment.profileId}-${finishDate.getTime()}`,
      };

      // Создаем новый платеж для рекуррентного платежа
      await this.paymentsRepository.createPayment(createPaymentData, tx);

      // Обновляем статус предыдущего платежа на COMPLETED
      await this.paymentsRepository.completePayment(
        existingPayment.customPaymentId,
        PaymentStatus.COMPLETED,
        false,
        finishDate,
        tx,
      );

      const createSubscriptionUpdateMessageData: CreateSubscriptionUpdateMessageDto =
        {
          customPaymentId: existingPayment.customPaymentId,
          createdAt,
          amount,
          paymentService: existingPayment.paymentProvider,
          subscriptionId,
          subscriptionType,
          currentPeriodEnd,
          nextPaymentDate,
          timestamp: new Date().toISOString(),
        };

      // Создаем таску для обновления периода подписки в Lumio
      await this.outboxService.createSubscriptionUpdatedMessage(
        createSubscriptionUpdateMessageData,
        tx,
      );

      this.logger.log(
        `Создано сообщение для обновления подписки в Lumio: subscriptionId=${subscriptionId}, periodEnd=${currentPeriodEnd.toISOString()}`,
        ProcessRecurringPaymentCommandHandler.name,
      );
    });

    this.logger.log(
      `Успешно обработан рекуррентный платеж: invoice=${invoice.id}`,
      ProcessRecurringPaymentCommandHandler.name,
    );
  }
}
