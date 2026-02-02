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
import { Payment } from 'generated/prisma-payments';

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
    const lastSuccessfulPayment =
      await this.paymentsRepository.findLastSuccessfulPaymentByProfileId(
        +dto.profileId,
      );

    const trialEndDate = this.calculateTrialEndDate(lastSuccessfulPayment);
    const amount: number = SUBSCRIPTION_PRICES[dto.subscriptionType];

    let session: Stripe.Checkout.Session;

    try {
      session = await this.stripeAdapter.createPaymentSession(
        dto.subscriptionType,
        amount,
        dto.profileId,
        dto.currency,
        trialEndDate,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create subscription payment session for profileId=${dto.profileId}: ${error.message}`,
        error?.stack,
        CommandHandler.name,
      );
    }

    const subscriptionId = session.subscription.toString();
    const stripePaymentCreatedAt = new Date(session.created * 1000);
    const customPaymentId = session.metadata.customPaymentId;

    const createDomainPymentData: CreatePaymentDomainDto = {
      paymentProvider: dto.paymentProvider,
      currency: dto.currency,
      amount: amount,
      profileId: +dto.profileId,
      status: 'pending',
      subscriptionType: dto.subscriptionType,
      autoRenewal: true,
      subscriptionId,
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
          createDomainPymentData,
          tx,
        );
      });
      return payment.paymentsUrl;
    } catch (error) {
      try {
        if (session && session.id) {
          await this.stripeAdapter.cancelSession(session.id);
        }
      } catch (stripeError) {
        this.logger.warn(
          `Could not cancel Stripe session: ${stripeError.message}`,
          stripeError.stack,
        );
      }

      throw BadRequestDomainException.create(
        `Failed to create payment: ${error.message}`,
        'createPayment',
      );
    }
  }

  private calculateTrialEndDate(
    lastSuccessfulPayment: Payment | null,
  ): number | undefined {
    if (!lastSuccessfulPayment?.nextPaymentDate) {
      return undefined;
    }

    const nextPaymentDate = lastSuccessfulPayment.nextPaymentDate;

    if (nextPaymentDate <= new Date()) {
      return undefined;
    }

    return Math.floor(nextPaymentDate.getTime() / 1000);
  }
}
