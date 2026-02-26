import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionPaymentTransferDto } from '@libs/dto/transfer/subscription-payment.transfer.dto';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { CreatePaymentDomainDto } from '../../domain/dto/create-payment.domain.dto';
import Stripe from 'stripe';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { SUBSCRIPTION_PRICES } from '@payments/modules/subscriptions/constants/stripe-constants';
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
    const activeSubscription =
      await this.paymentsRepository.findActiveSubscriptionByProfileId(
        +dto.profileId,
      );

    let extensionSub = false;

    if (activeSubscription) {
      extensionSub = true;
    }

    const amount: number = SUBSCRIPTION_PRICES[dto.subscriptionType];

    let session: Stripe.Checkout.Session;

    try {
      session = await this.stripeAdapter.createPaymentSession(
        dto.subscriptionType,
        amount,
        dto.profileId,
        dto.currency,
        extensionSub,
      );
    } catch (error) {
      throw BadRequestDomainException.create(
        `Failed to create subscription payment session: ${error.message}`,
        'profileId',
      );
    }

    const stripePaymentCreatedAt = new Date(session.created * 1000);
    const customPaymentId = session.metadata.customPaymentId;

    const createDomainPaymentData: CreatePaymentDomainDto = {
      paymentProvider: dto.paymentProvider,
      currency: dto.currency,
      amount,
      profileId: +dto.profileId,
      status: 'pending',
      subscriptionType: dto.subscriptionType,
      autoRenewal: true,
      subscriptionId: null,
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
      const payment = await this.prisma.$transaction(async (tx) => {
        return await this.paymentsRepository.createPayment(
          createDomainPaymentData,
          tx,
        );
      });
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
