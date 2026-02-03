import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { ProcessInitialPaymentCommand } from './process-initial-payment.command-handler';
import { ProcessRecurringPaymentCommand } from './process-recurring-payment.command-handler';
import { ProcessSubscriptionCancelledCommand } from './process-subscription-cancelled.command-handler';
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
    private readonly commandBus: CommandBus,
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

        case StripeEventType.SUBSCRIPTION_CANCELLED:
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

  private async handleSubscriptionCancelled(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    await this.commandBus.execute(
      new ProcessSubscriptionCancelledCommand(subscription),
    );
  }
}
