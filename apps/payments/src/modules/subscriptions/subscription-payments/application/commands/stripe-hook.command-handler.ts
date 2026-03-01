import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { ProcessInitialPaymentCommand } from './process-initial-payment.command-handler';
import { ProcessRecurringPaymentCommand } from './process-recurring-payment.command-handler';
import { ProcessSubscriptionDeletedCommand } from './process-subscription-deleted.command-handler';
import Stripe from 'stripe';
import {
  PaymentStatus,
  StripeEventType,
  StripeBillingReason,
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
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: StripeHookCommand): Promise<void> {
    try {
      const event = await this.stripeAdapter.verify(
        command.rawBody,
        command.signature,
      );

      if (event.type === StripeEventType.CHECKOUT_SESSION_COMPLETED) {
        console.log('CHECKOUT_SESSION_COMPLETED');
        await this.handleInitialPayment(event);
      }

      if (event.type === StripeEventType.CUSTOMER_SUBSCRIPTION_DELETED) {
        console.log('CUSTOMER_SUBSCRIPTION_DELETED');
        await this.handleSubscriptionDeleted(event);
      }

      if (
        event.type === StripeEventType.INVOICE_PAID &&
        event.data.object.billing_reason ===
          StripeBillingReason.SUBSCRIPTION_CYCLE
      ) {
        console.log('SUBSCRIPTION_CYCLE');
        await this.handleRecurringPayment(event);

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

  private async handleInitialPayment(
    event: Stripe.CheckoutSessionCompletedEvent,
  ) {
    const session = event.data.object;

    if (session.payment_status !== 'paid') {
      return;
    }

    const existingPayment = await this.paymentsRepository.findByCustomPaymentId(
      session.metadata.customPaymentId,
    );

    if (existingPayment?.status === PaymentStatus.SUCCESSFUL) {
      this.logger.log(
        `Webhook already processed for payment ${existingPayment.customPaymentId}`,
        'StripeHook',
      );
      return;
    }

    await this.commandBus.execute(
      new ProcessInitialPaymentCommand(session, event),
    );
  }

  private async handleRecurringPayment(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    await this.commandBus.execute(new ProcessRecurringPaymentCommand(invoice));
  }

  private async handleSubscriptionDeleted(event: Stripe.Event) {
    await this.commandBus.execute(new ProcessSubscriptionDeletedCommand(event));
  }
}
