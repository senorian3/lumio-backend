import { Stripe } from 'stripe';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '../../domain/infrastructure/payments.repository';
import { StripeAdapter } from '../stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { PaymentStatus } from '@payments/modules/subscriptions/constants/stripe-constants';
import { UpdatePaymentDomainDto } from '../../domain/dto/update-payment.domain.dto';
import { ManualReviewService } from '@payments/modules/subscriptions/subscription-payments/application/manual-review.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
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
    private readonly logger: AppLoggerService,
    private readonly outboxService: OutboxService,
    private readonly prisma: PrismaService,
    private readonly manualReviewService: ManualReviewService,
    private readonly retryService: RetryService,
  ) {}

  async execute(command: ProcessInitialPaymentCommand): Promise<void> {
    const { session } = command;
    const customPaymentId = session.metadata.customPaymentId;
    const subscriptionId = session.subscription.toString();

    try {
      await this.retryService.executeWithRetry(async () => {
        const currentPayment =
          await this.paymentsRepository.findByCustomPaymentId(customPaymentId);

        if (!currentPayment) {
          this.logger.error(
            `Payment with customPaymentId ${customPaymentId} not found`,
            this.paymentsRepository.findByCustomPaymentId.name,
            ProcessInitialPaymentCommand.name,
          );
          throw new Error();
        }

        let subscriptionDetails: Stripe.Subscription;

        try {
          subscriptionDetails =
            await this.stripeAdapter.getSubscriptionDetails(subscriptionId);
        } catch (error) {
          this.logger.error(
            `Failed to retrieve subscription details for subscriptionId ${subscriptionId}: ${error.message}`,
            error.stack,
            ProcessInitialPaymentCommand.name,
          );
        }

        const { periodStart, periodEnd } = this.calculatePeriodDates(
          subscriptionDetails.billing_cycle_anchor,
          currentPayment.subscriptionType,
        );

        await this.prisma.$transaction(async (tx) => {
          const updatePaymentData: UpdatePaymentDomainDto = {
            customPaymentId,
            subscriptionId,
            status: PaymentStatus.SUCCESSFUL,
            periodStart,
            periodEnd,
            nextPaymentDate: periodEnd,
          };

          await this.paymentsRepository.updatePayment(updatePaymentData, tx);

          const createPaymentData: CreatePaymentCompleteMessageDto = {
            paymentId: customPaymentId,
            profileId: currentPayment.profileId,
            amount: currentPayment.amount,
            currency: currentPayment.currency,
            subscriptionId,
            subscriptionType: currentPayment.subscriptionType,
            periodStart,
            periodEnd,
            timestamp: new Date().toISOString(),
            paymentsService: currentPayment.paymentProvider,
          };

          await this.outboxService.createPaymentCompletedMessage(
            createPaymentData,
            tx,
          );
        });
      });
    } catch (error) {
      this.logger.error(
        `Failed to process initial payment after retries: ${error.message}, customPaymentId: ${customPaymentId}, subscriptionId: ${subscriptionId}`,
        error.stack,
        ProcessInitialPaymentCommand.name,
      );
      try {
        await this.manualReviewService.createFailedInitialPaymentTask(
          session,
          error,
        );
      } catch (error) {
        this.logger.error(
          `Critical error processing initial payment after retries: ${error.message}, customPaymentId: ${customPaymentId}, subscriptionId: ${subscriptionId}`,
          error.stack,
          ProcessInitialPaymentCommand.name,
        );
      }

      throw BadRequestDomainException.create(
        'Something went wrong processing initial payment, we are working on it',
        'payment',
      );
    }
  }

  private calculatePeriodDates(
    billingCycleAnchor: number,
    subscriptionType: string,
  ): { periodStart: Date; periodEnd: Date } {
    const periodStart = new Date(billingCycleAnchor * 1000);

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
