import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '@payments/modules/subscription-payments/domain/infrastructure/payments.repository';
import { StripeService } from '@payments/modules/subscription-payments/adapters/stripe.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { AppLoggerService } from '@libs/logger/logger.service';
import Stripe from 'stripe';

export enum StripeEventType {
  SESSION_COMPLETED = 'checkout.session.completed',
  INVOICE_PAID = 'invoice.paid',
  SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
}

export enum PaymentStatus {
  SUCCESSFUL = 'successful',
}

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
    private paymentsRepository: PaymentsRepository,
    private stripeService: StripeService,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(command: StripeHookCommand): Promise<void> {
    try {
      const event = await this.stripeService.verify(
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

    for (const subscription of activeSubscriptions) {
      if (
        subscription.subscriptionId &&
        subscription.subscriptionId !== subscriptionId
      ) {
        try {
          await this.stripeService.cancelSubscriptionAtPeriodEnd(
            subscription.subscriptionId,
          );

          await this.paymentsRepository.updatePaymentAutoRenewal(
            subscription.id,
            false,
            new Date(),
          );
        } catch (error) {
          console.error(
            `Ошибка при отключении автопродления у подписки ${subscription.subscriptionId}:`,
            error,
          );
        }
      }
    }

    let subscriptionDetails;
    try {
      subscriptionDetails =
        await this.stripeService.getSubscriptionDetails(subscriptionId);
    } catch (error) {
      console.error(error);
      throw BadRequestDomainException.create(
        'Ошибка получения деталей подписки',
        'SUBSCRIPTION_DETAILS_ERROR',
      );
    }

    const currentPeriodStart = new Date(
      subscriptionDetails.billing_cycle_anchor
        ? subscriptionDetails.billing_cycle_anchor * 1000
        : subscriptionDetails.current_period_start * 1000,
    );

    const subscriptionType =
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

    const currentPeriodEnd = new Date(
      currentPeriodStart.getTime() + periodDuration,
    );
    const nextPaymentDate = currentPeriodEnd;

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
    );

    //outbox

    console.log(
      `Подписка ${subscriptionId} успешно создана для профиля ${profileId} с автопродлением`,
    );
  }

  private async handleRecurringPayment(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;

    if (invoice.status !== 'paid') {
      this.logger.debug(`Пропущен неоплаченный инвойс: ${invoice.id}`);
      return;
    }

    const subscriptionId = (invoice as any).subscription as string | null;

    if (!subscriptionId) {
      this.logger.warn(
        `Инвойс ${invoice.id} не содержит информацию о подписке`,
      );
      return;
    }

    try {
      // const subscription =
      //   await this.stripeService.getSubscriptionDetails(subscriptionId);

      const existingPayment =
        await this.paymentsRepository.findPaymentBySubscriptionId(
          subscriptionId,
        );

      if (!existingPayment) {
        this.logger.debug(
          `Платеж для подписки ${subscriptionId} ещё не создан в БД. Пропускаем.`,
        );
        return;
      }

      const currentPeriodStart = new Date(invoice.period_start * 1000);
      const currentPeriodEnd = new Date(invoice.period_end * 1000);
      const nextPaymentDate = new Date(invoice.period_end * 1000);

      await this.paymentsRepository.updatePayment(
        existingPayment.id,
        PaymentStatus.SUCCESSFUL,
        subscriptionId,
        currentPeriodStart,
        currentPeriodEnd,
        nextPaymentDate,
        existingPayment.subscriptionType,
        true,
        null,
      );
    } catch (error) {
      console.error(error);
    }
  }

  private async handleSubscriptionCancelled(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    const payment = await this.paymentsRepository.findPaymentBySubscriptionId(
      subscription.id,
    );

    if (payment) {
      await this.paymentsRepository.updatePaymentStatus(
        payment.id,
        'cancelled',
      );

      this.logger.log(
        `Подписка ${subscription.id} полностью завершена после окончания периода`,
        'SubscriptionLifecycle',
      );
    }

    //отпровляем оповещение об отмене подписки
  }
}
