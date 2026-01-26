import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '@payments/modules/subscription-payments/domain/infrastructure/payments.repository';
import { StripeService } from '@payments/modules/subscription-payments/adapters/stripe.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import Stripe from 'stripe';
import { AppLoggerService } from '@libs/logger/logger.service';

export enum StripeEventType {
  SESSION_COMPLETED = 'checkout.session.completed',
  INVOICE_PAID = 'invoice.paid',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  SESSION_EXPIRED = 'checkout.session.expired',
  PAYMENT_INTENT_FAILED = 'payment_intent.payment_failed',
}

export enum PaymentStatus {
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
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

        case StripeEventType.INVOICE_PAYMENT_FAILED:
        case StripeEventType.PAYMENT_INTENT_FAILED:
        case StripeEventType.SESSION_EXPIRED:
          await this.handleFailedPayment(event);
          this.logger.debug(
            `Получено событие Stripe: ${event.type} (ID: ${event.id})`,
            'BAD',
          );
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
      subscriptionDetails.billing_cycle_anchor * 1000,
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
    );
  }

  private async handleRecurringPayment(event: Stripe.Event) {
    console.log(event);
  }

  private async handleFailedPayment(event: Stripe.Event) {
    console.log(event);
  }

  private async handleSubscriptionCancelled(event: Stripe.Event) {
    console.log(event);
  }
}
