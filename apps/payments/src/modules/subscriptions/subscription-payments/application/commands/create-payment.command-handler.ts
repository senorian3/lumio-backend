import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionPaymentTransferDto } from '@libs/dto/transfer/subscription-payment.transfer.dto';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { CreatePaymentDomainDto } from '../../domain/dto/create-payment.domain.dto';
import Stripe from 'stripe';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  PaymentStatus,
  SUBSCRIPTION_PRICES,
} from '@payments/modules/subscriptions/constants/stripe-constants';
import { PrismaService } from '@payments/prisma/prisma.service';

export class CreateSubscriptionPaymentCommand {
  constructor(public dto: SubscriptionPaymentTransferDto) {}
}

@CommandHandler(CreateSubscriptionPaymentCommand)
export class CreateSubscriptionPaymentCommandHandler implements ICommandHandler<
  CreateSubscriptionPaymentCommand,
  string
> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly stripeAdapter: StripeAdapter,
    private readonly logger: AppLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async execute({ dto }: CreateSubscriptionPaymentCommand): Promise<string> {
    const pendingPayment =
      await this.paymentsRepository.findPendingPaymentByProfileId(
        +dto.profileId,
      );

    if (pendingPayment) {
      return pendingPayment.paymentsUrl;
    }

    const activeSubscription =
      await this.paymentsRepository.findActiveSubscriptionPaymentByProfileId(
        +dto.profileId,
      );

    const amount: number = SUBSCRIPTION_PRICES[dto.subscriptionType];

    const session: Stripe.Checkout.Session = await this.stripeAdapter
      .createPaymentSession(
        dto.subscriptionType,
        amount,
        dto.profileId,
        dto.currency,
        activeSubscription ? activeSubscription.subscriptionId : 'null',
      )
      .catch((error) => {
        throw BadRequestDomainException.create(
          `Failed to create subscription payment session: ${error.message}`,
          'profileId',
        );
      });

    const stripePaymentCreatedAt = new Date(session.created * 1000);
    const customPaymentId = session.metadata.customPaymentId;

    const createDomainPaymentData: CreatePaymentDomainDto = {
      paymentProvider: dto.paymentProvider,
      currency: dto.currency,
      amount,
      profileId: +dto.profileId,
      status: PaymentStatus.PENDING,
      subscriptionType: dto.subscriptionType,
      autoRenewal: false,
      subscriptionId: null,
      stripeSubscriptionId: null,
      mainSubscriptionId: null,
      periodStart: null,
      periodEnd: null,
      nextPaymentDate: null,
      createdAt: new Date(),
      paymentsUrl: session.url,
      stripePaymentCreatedAt,
      cancelledAt: null,
      customPaymentId,
    };

    try {
      const payment = await this.paymentsRepository.createPayment(
        createDomainPaymentData,
      );
      return payment.paymentsUrl;
    } catch (error) {
      this.logger.error(
        `Failed to create payment: ${error.message}`,
        error.stack,
        CreateSubscriptionPaymentCommandHandler.name,
      );
      try {
        await this.stripeAdapter.cancelSession(session.id);
      } catch (stripeError) {
        this.logger.warn(
          `Could not cancel Stripe session: ${stripeError.message}`,
          CreateSubscriptionPaymentCommandHandler.name,
        );
      }
      throw BadRequestDomainException.create(
        'Failed to create payment',
        'profileId',
      );
    }
  }
}
