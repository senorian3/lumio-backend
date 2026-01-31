import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import Stripe from 'stripe';
import {
  PaymentStatus,
  StripeEventType,
} from '@payments/modules/subscriptions/constants/stripe-constants';

export class StripeHookCommand {
  constructor(
    public readonly signature: string,
    public readonly rawBody: Buffer,
  ) {}
}

@CommandHandler(StripeHookCommand)
export class StripeHookCommandHandler implements ICommandHandler<
  StripeHookCommand,
  void
> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly stripeAdapter: StripeAdapter,
    private readonly logger: AppLoggerService,
    private readonly outboxService: OutboxService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: StripeHookCommand): Promise<void> {
    try {
      const event = await this.stripeAdapter.verify(
        command.rawBody,
        command.signature,
      );

      switch (event.type) {
        case StripeEventType.SESSION_COMPLETED:
          await this.handleInitialPayment(event);
          break;

        case StripeEventType.INVOICE_PAID:
          await this.handleRecurringPayment(event);
          break;

        case StripeEventType.SUBSCRIPTION_DELETED:
          await this.handleSubscriptionCancelled(event);
          this.logger.debug(
            `Получено событие Stripe: ${event.type} (ID: ${event.id})`,
            'CANCEL',
          );
          break;

        default:
          this.logger.verbose(
            `Пропущено событие: ${event.type}`,
            'StripeWebhook',
          );
          return;
      }
    } catch (error) {
      this.logger.error(
        `Критическая ошибка при обработке вебхука Stripe: ${error.message}`,
        error.stack,
        'StripeWebhook',
      );
      throw error;
    }
  }

  private async handleInitialPayment(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== 'paid') {
      return;
    }

    if (!session.client_reference_id) {
      throw BadRequestDomainException.create(
        'Отсутствует client_reference_id в сессии',
        'MISSING_CLIENT_REFERENCE',
      );
    }

    const paymentId = parseInt(session.client_reference_id, 10);
    if (isNaN(paymentId) || paymentId <= 0) {
      throw BadRequestDomainException.create(
        `Некорректный paymentId: ${session.client_reference_id}`,
        'INVALID_PAYMENT_ID',
      );
    }

    if (!session.subscription) {
      throw BadRequestDomainException.create(
        'Отсутствует subscription ID в сессии',
        'MISSING_SUBSCRIPTION_ID',
      );
    }

    const subscriptionId = session.subscription.toString();

    const currentPayment =
      await this.paymentsRepository.findPaymentById(paymentId);

    if (!currentPayment) {
      throw BadRequestDomainException.create(
        `Платеж с ID ${paymentId} не найден`,
        'PAYMENT_NOT_FOUND',
      );
    }

    const profileId = currentPayment.profileId;

    const activeSubscriptions =
      await this.paymentsRepository.findActiveSubscriptionsWithAutoRenewalByProfileId(
        profileId,
      );

    // Шаг 1: Транзакция с базой данных (все операции с БД)
    let subscriptionType: string;
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date;
    let nextPaymentDate: Date;

    try {
      // Получаем детали подписки (внешний вызов)
      let subscriptionDetails;

      try {
        subscriptionDetails =
          await this.stripeAdapter.getSubscriptionDetails(subscriptionId);
      } catch (error) {
        this.logger.error(error.message, error.stack, 'getSubscriptionDetails');
        throw BadRequestDomainException.create(
          'Failed to retrieve subscription details',
          'subscriptionId',
        );
      }

      currentPeriodStart = new Date(
        subscriptionDetails.billing_cycle_anchor
          ? subscriptionDetails.billing_cycle_anchor * 1000
          : subscriptionDetails.current_period_start * 1000,
      );

      subscriptionType =
        session.metadata?.subscriptionType ||
        (subscriptionDetails.metadata as any)?.subscriptionType ||
        '1 month';

      let periodDuration: number;

      if (subscriptionType.includes('week')) {
        const weekCount = subscriptionType.includes('2') ? 2 : 1;
        periodDuration = weekCount * 7 * 24 * 60 * 60 * 1000;
      } else {
        periodDuration = 30 * 24 * 60 * 60 * 1000;
      }

      currentPeriodEnd = new Date(
        currentPeriodStart.getTime() + periodDuration,
      );
      nextPaymentDate = currentPeriodEnd;

      // ✅ Гарантируем ровно 30 дней для месячной подписки (минимальное изменение)
      if (subscriptionType === '1 month') {
        currentPeriodEnd = new Date(
          currentPeriodStart.getTime() + 30 * 24 * 60 * 60 * 1000,
        );
        nextPaymentDate = currentPeriodEnd;
      }

      // Транзакция для обновления платежа в БД
      await this.prisma.$transaction(async (tx) => {
        // Отключаем автопродление для существующих подписок
        for (const subscription of activeSubscriptions) {
          if (
            subscription.subscriptionId &&
            subscription.subscriptionId !== subscriptionId
          ) {
            await this.paymentsRepository.updatePaymentAutoRenewal(
              subscription.id,
              false,
              new Date(),
              tx,
            );
          }
        }

        // Обновляем основной платеж
        await this.paymentsRepository.updatePayment(
          paymentId,
          PaymentStatus.SUCCESSFUL,
          subscriptionId,
          currentPeriodStart,
          currentPeriodEnd,
          nextPaymentDate,
          subscriptionType,
          true,
          null,
          tx,
        );

        // Шаг 2: Создание outbox сообщений для внешних вызовов (в транзакции)
        for (const subscription of activeSubscriptions) {
          if (
            subscription.subscriptionId &&
            subscription.subscriptionId !== subscriptionId
          ) {
            await this.outboxService.createCancelSubscriptionMessage(
              subscription.id,
              subscription.subscriptionId,
              tx,
            );
          }
        }

        // Шаг 3: Создание outbox сообщения (в транзакции)
        await this.outboxService.createPaymentCompletedMessage(
          paymentId,
          {
            profileId,
            amount: currentPayment.amount,
            currency: currentPayment.currency,
            subscriptionId,
            subscriptionType,
            periodStart: currentPeriodStart,
            periodEnd: currentPeriodEnd,
            nextPaymentDate,
          },
          tx,
        );
      });
    } catch (error) {
      // Compensating Transaction: Отмена платежа, если что-то пошло не так
      await this.prisma.$transaction(async (tx) => {
        await this.paymentsRepository.cancelPaymentInTransaction(paymentId, tx);
      });

      this.logger.error(error.message, error.stack, 'handleInitialPayment');

      throw BadRequestDomainException.create(
        'Failed to create subscription',
        'subscriptionId',
      );
    }

    this.logger.log(
      `Подписка ${subscriptionId} успешно создана для профиля ${profileId} с автопродлением`,
      'StripeHook',
    );
  }

  private async handleRecurringPayment(event: Stripe.Event) {
    try {
      const invoice = event.data.object as Stripe.Invoice;

      // Пропускаем первый инвойс при создании подписки
      if (invoice.billing_reason === 'subscription_create') {
        return;
      }

      // Проверяем статус инвойса
      if (invoice.status !== 'paid') {
        return;
      }

      // Извлекаем данные подписки
      const subscriptionId = invoice.parent.subscription_details
        .subscription as string;

      if (!subscriptionId) {
        return;
      }

      // Ищем существующий платеж в БД
      const existingPayment =
        await this.paymentsRepository.findPaymentBySubscriptionId(
          subscriptionId,
        );

      if (!existingPayment) {
        return;
      }

      const invoiceLine = invoice.lines.data[0];
      if (!invoiceLine) {
        throw BadRequestDomainException.create(
          'Invoice has no line items',
          'invoice.lines',
        );
      }

      const currentPeriodStart = new Date(invoiceLine.period.start * 1000);
      const currentPeriodEnd = new Date(invoiceLine.period.end * 1000);
      const nextPaymentDate = currentPeriodEnd;

      // Определяем тип подписки из метаданных инвойса (более надёжно)
      const subscriptionType =
        invoiceLine.metadata?.subscriptionType ||
        existingPayment.subscriptionType ||
        '1 month';

      await this.prisma.$transaction(async (tx) => {
        // Обновляем платеж с новыми датами
        await this.paymentsRepository.updatePayment(
          existingPayment.id,
          PaymentStatus.SUCCESSFUL,
          subscriptionId,
          currentPeriodStart,
          currentPeriodEnd,
          nextPaymentDate,
          subscriptionType,
          true,
          null,
          tx,
        );

        // Создаем таску для обновления периода подписки в Lumio (в транзакции)
        await this.outboxService.createSubscriptionUpdatedMessage(
          existingPayment.id,
          subscriptionId,
          subscriptionType,
          currentPeriodEnd,
          nextPaymentDate,
          tx,
        );
      });

      this.logger.debug(
        `Рекуррентный платеж для подписки ${subscriptionId} успешно обработан`,
      );
    } catch (error) {
      this.logger.error(
        `Ошибка при обработке рекуррентного платежа: ${(error as Error).message}`,
        error,
      );
      throw error;
    }
  }

  private async handleSubscriptionCancelled(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    const payment = await this.paymentsRepository.findPaymentBySubscriptionId(
      subscription.id,
    );

    if (!payment) {
      throw BadRequestDomainException.create(
        `Payment not found for subscription ${subscription.id}`,
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await this.paymentsRepository.updatePaymentStatus(
        payment.id,
        PaymentStatus.CANCELLED,
        tx,
      );

      await this.outboxService.createSubscriptionCancelledMessage(
        payment.id,
        subscription.id,
        tx,
      );
    });

    this.logger.log(
      `Подписка ${subscription.id} полностью завершена после окончания периода`,
      'SubscriptionLifecycle',
    );
  }
}
