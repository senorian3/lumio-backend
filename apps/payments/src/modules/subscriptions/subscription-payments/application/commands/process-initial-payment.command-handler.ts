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
import { v4 as uuidv4 } from 'uuid';

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
    const stripeSubscriptionId = session.subscription.toString();
    const mainSubscriptionId: string | null =
      session.metadata.mainSubscriptionId !== 'null'
        ? session.metadata.mainSubscriptionId
        : null;

    try {
      await this.retryService.executeWithRetry(async () => {
        const currentPayment =
          await this.paymentsRepository.findByCustomPaymentId(customPaymentId);

        if (!currentPayment) {
          throw new Error(
            `Payment with customPaymentId ${customPaymentId} not found`,
          );
        }

        const lastActiveSubscriptionPayment =
          await this.paymentsRepository.findLastActiveSubscriptionByProfileId(
            currentPayment.profileId,
            new Date(),
            customPaymentId,
          );

        const mainSubscription = mainSubscriptionId
          ? await this.paymentsRepository.findBySubscriptionId(
              mainSubscriptionId,
            )
          : null;

        if (mainSubscriptionId && !mainSubscription) {
          throw new Error(
            `Main subscription with ID ${mainSubscriptionId} not found`,
          );
        }

        const subscriptionDetails: Stripe.Subscription =
          await this.stripeAdapter.getSubscriptionDetails(stripeSubscriptionId);

        const startDate = new Date(
          subscriptionDetails.billing_cycle_anchor * 1000,
        );

        let extraTime = 0;

        if (lastActiveSubscriptionPayment) {
          const now = new Date();
          const remainingTime =
            lastActiveSubscriptionPayment.periodEnd.getTime() - now.getTime();

          if (remainingTime > 0) {
            extraTime = remainingTime;
          }
        }

        const { periodStart, periodEnd } = this.calculatePeriodDates(
          startDate,
          currentPayment.subscriptionType,
          extraTime,
        );

        const subscriptionId = uuidv4();

        await this.prisma.$transaction(async (tx) => {
          const hasActiveSubscription = !!lastActiveSubscriptionPayment;

          const shouldContinue = await this.checkIdempotencyAndHandle(
            customPaymentId,
            stripeSubscriptionId,
            tx,
          );

          if (!shouldContinue) {
            return;
          }

          const updatePaymentData: UpdatePaymentDomainDto = {
            customPaymentId,
            subscriptionId,
            stripeSubscriptionId,
            mainSubscriptionId,
            status: hasActiveSubscription
              ? PaymentStatus.EXTENSION
              : PaymentStatus.ACTIVE,
            periodStart,
            periodEnd,
            nextPaymentDate: periodEnd,
            autoRenewal: hasActiveSubscription ? false : true,
          };

          await this.paymentsRepository.updateCustomPaymentId(
            updatePaymentData,
            tx,
          );

          if (mainSubscription) {
            await this.paymentsRepository.updatePaymentSubscriptionPeriodDate(
              mainSubscription.customPaymentId,
              periodEnd,
              tx,
            );
          }

          if (lastActiveSubscriptionPayment) {
            await this.outboxService.updateCustomerSubscriptionEndDateMessage(
              {
                stripeSubscriptionId,
                periodEndDate: Math.floor(new Date(periodEnd).getTime() / 1000),
                autoRenewal: mainSubscription
                  ? mainSubscription.autoRenewal
                  : lastActiveSubscriptionPayment.autoRenewal,
                timestamp: new Date().toISOString(),
              },
              tx,
            );

            await this.outboxService.createCancelSubscriptionImmediatelyMessage(
              {
                stripeSubscriptionId:
                  lastActiveSubscriptionPayment.stripeSubscriptionId,
                timestamp: new Date().toISOString(),
              },
              tx,
            );
          }

          const createPaymentMessageData: CreatePaymentCompleteMessageDto = {
            paymentId: customPaymentId,
            profileId: currentPayment.profileId,
            subscriptionId,
            mainSubscriptionId,
            subscriptionType: currentPayment.subscriptionType,
            periodStart,
            periodEnd,
          };

          await this.outboxService.createPaymentCompletedMessage(
            createPaymentMessageData,
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

  private async checkIdempotencyAndHandle(
    customPaymentId: string,
    stripeSubscriptionId: string,
    tx: any,
  ): Promise<boolean> {
    const existingPayment =
      await this.paymentsRepository.findPaymentForIdempotencyCheck(
        customPaymentId,
        tx,
      );

    const isAlreadyProcessed =
      existingPayment.status === PaymentStatus.ACTIVE ||
      existingPayment.status === PaymentStatus.EXTENSION;

    const hasSameStripeSubscription =
      existingPayment.stripeSubscriptionId === stripeSubscriptionId;

    if (isAlreadyProcessed && hasSameStripeSubscription) {
      return false;
    }

    return true;
  }

  private calculatePeriodDates(
    periodStart: Date,
    subscriptionType: string,
    extraTime?: number | null,
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

    if (extraTime && extraTime > 0) {
      periodDuration += extraTime;
    }

    const periodEnd = new Date(periodStart.getTime() + periodDuration);

    return { periodStart, periodEnd };
  }
}
