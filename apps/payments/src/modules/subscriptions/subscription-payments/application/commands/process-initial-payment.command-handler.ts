import { Stripe } from 'stripe';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '../../domain/infrastructure/payments.repository';
import { StripeAdapter } from '../stripe.adapter';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { PaymentStatus } from '@payments/modules/subscriptions/constants/stripe-constants';
import { UpdatePaymentDomainDto } from '../../domain/dto/update-payment.domain.dto';
import { ManualReviewService } from '@payments/modules/subscriptions/subscription-payments/application/manual-review.service';
import { RetryService } from '../retry.service';
import { CreatePaymentCompleteMessageDto } from '@libs/dto/transfer/create-payment-complete-message.dto';

export class ProcessInitialPaymentCommand {
  constructor(
    public readonly session: Stripe.Checkout.Session,
    public readonly event: Stripe.Event,
  ) {}
}

@CommandHandler(ProcessInitialPaymentCommand)
export class ProcessInitialPaymentCommandHandler implements ICommandHandler<
  ProcessInitialPaymentCommand,
  void
> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly stripeAdapter: StripeAdapter,
    private readonly outboxService: OutboxService,
    private readonly prisma: PrismaService,
    private readonly manualReviewService: ManualReviewService,
    private readonly retryService: RetryService,
  ) {}

  async execute(command: ProcessInitialPaymentCommand): Promise<void> {
    const { session } = command;
    const customPaymentId = session.metadata.customPaymentId;
    const subscriptionId = session.subscription.toString();
    const mainSubscriptionId: string | null =
      session.metadata.mainSubscriptionId !== 'null'
        ? session.metadata.mainSubscriptionId
        : null;

    try {
      await this.retryService.executeWithRetry(async () => {
        const mainSubscription = mainSubscriptionId
          ? await this.paymentsRepository.findBySubscriptionId(
              mainSubscriptionId,
            )
          : null;

        const currentPayment =
          await this.paymentsRepository.findByCustomPaymentId(customPaymentId);

        if (!currentPayment) {
          throw new Error(
            `Payment with customPaymentId ${customPaymentId} not found`,
          );
        }

        const subscriptionDetails: Stripe.Subscription =
          await this.stripeAdapter.getSubscriptionDetails(subscriptionId);

        const startDate = mainSubscription
          ? mainSubscription.periodEnd || mainSubscription.nextPaymentDate
          : new Date(subscriptionDetails.billing_cycle_anchor * 1000);

        const { periodStart, periodEnd } = this.calculatePeriodDates(
          startDate,
          currentPayment.subscriptionType,
        );

        await this.prisma.$transaction(async (tx) => {
          const updatePaymentData: UpdatePaymentDomainDto = {
            customPaymentId,
            subscriptionId,
            status: mainSubscription
              ? PaymentStatus.EXTENSION
              : PaymentStatus.SUCCESSFUL,
            periodStart,
            periodEnd,
            nextPaymentDate: periodEnd,
            autoRenewal: mainSubscription ? false : true,
          };

          await this.paymentsRepository.updatePayment(updatePaymentData, tx);

          if (mainSubscription) {
            await this.paymentsRepository.updateSubPeriodEndDate(
              mainSubscription.customPaymentId,
              subscriptionId,
              periodEnd,
              tx,
            );

            await this.outboxService.updateCustomerSubscriptionEndDateMessage(
              {
                subscriptionId: mainSubscription.subscriptionId,
                periodEndDate: periodEnd.getTime() / 1000,
                timestamp: new Date().toISOString(),
              },
              tx,
            );

            // await this.outboxService.updateSubscriptionMetadataMessage(
            //   {
            //     subscriptionId: mainSubscription.subscriptionId,
            //     metadata: {
            //       extensionSub: 'true',
            //     },
            //     timestamp: new Date().toISOString(),
            //   },
            //   tx,
            // );
          }

          const createPaymentData: CreatePaymentCompleteMessageDto = {
            paymentId: customPaymentId,
            profileId: currentPayment.profileId,
            amount: currentPayment.amount,
            currency: currentPayment.currency,
            subscriptionId: mainSubscription
              ? mainSubscription.subscriptionId
              : subscriptionId,
            subscriptionType: mainSubscription
              ? mainSubscription.subscriptionType
              : currentPayment.subscriptionType,
            periodStart,
            periodEnd,
            timestamp: new Date().toISOString(),
            paymentsService: currentPayment.paymentProvider,
            mainSubscriptionId: mainSubscriptionId,
          };

          await this.outboxService.createPaymentCompletedMessage(
            createPaymentData,
            tx,
          );
        });
      });
    } catch (error) {
      await this.manualReviewService.createFailedInitialPaymentTask(
        session,
        error,
      );
      throw error;
    }
  }

  private calculatePeriodDates(
    periodStart: Date,
    subscriptionType: string,
  ): { periodStart: Date; periodEnd: Date } {
    let periodDuration: number;

    if (subscriptionType.includes('week')) {
      const weekCount = subscriptionType.includes('2') ? 2 : 1;
      periodDuration = weekCount * 7 * 24 * 60 * 60 * 1000;
    } else if (subscriptionType.includes('month')) {
      const monthCount = subscriptionType.includes('3') ? 3 : 1;
      periodDuration = monthCount * 30 * 24 * 60 * 60 * 1000;
    } else if (subscriptionType.includes('year')) {
      periodDuration = 365 * 24 * 60 * 60 * 1000;
    } else {
      periodDuration = 30 * 24 * 60 * 60 * 1000;
    }

    const periodEnd = new Date(periodStart.getTime() + periodDuration);

    return { periodStart, periodEnd };
  }
}
