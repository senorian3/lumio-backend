import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '@payments/modules/subscription-payments/domain/infrastructure/payments.repository';
import { StripeService } from '@payments/modules/subscription-payments/adapters/stripe.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import Stripe from 'stripe';

export enum StripeEventType {
  SESSION_COMPLETED = 'checkout.session.completed',
  SESSION_EXPIRED = 'checkout.session.expired',
  PAYMENT_FAILED = 'payment_intent.payment_failed',
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
  ) {}

  async execute(command: StripeHookCommand): Promise<void> {
    const event = await this.stripeService.verify(
      command.rawBody,
      command.signature,
    );

    switch (event.type) {
      case StripeEventType.SESSION_COMPLETED:
        await this.handleSessionCompleted(event);
        break;

      case StripeEventType.SESSION_EXPIRED:
      case StripeEventType.PAYMENT_FAILED:
        await this.handleFailedPayment(event);
        break;

      default:
        console.log(`Необработанный тип события: ${event.type}`);
        return;
    }
  }

  private async handleSessionCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== 'paid') {
      console.log(`Ожидание подтверждения платежа для сессии ${session.id}`);
      return;
    }

    if (!session.client_reference_id) {
      throw BadRequestDomainException.create(
        'Отсутствует client_reference_id в сессии',
        'MISSING_CLIENT_REFERENCE',
      );
    }

    console.log('good');

    await this.paymentsRepository.updatePaymentStatus(
      +session.client_reference_id,
      PaymentStatus.SUCCESSFUL,
    );

    // TODO: Логика обработки удачной оплаты (используйте clientReferenceId)
  }

  private async handleFailedPayment(event: Stripe.Event) {
    let clientReferenceId: string | null = null;

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      clientReferenceId = session.client_reference_id;
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      clientReferenceId = paymentIntent.metadata?.paymentId || null;
    }

    if (!clientReferenceId) {
      throw BadRequestDomainException.create(
        `Отсутствует client_reference_id для события ${event.type}`,
        'MISSING_CLIENT_REFERENCE',
      );
    }

    console.log('bad');

    await this.paymentsRepository.updatePaymentStatus(
      +clientReferenceId,
      PaymentStatus.FAILED,
    );

    // TODO: Логика обработки неудачной оплаты (используйте clientReferenceId)
  }
}
