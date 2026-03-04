import { Stripe } from 'stripe';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '../../domain/infrastructure/payments.repository';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { PaymentStatus } from '@payments/modules/subscriptions/constants/stripe-constants';
import { CreatePaymentDomainDto } from '../../domain/dto/create-payment.domain.dto';
import { ManualReviewService } from '../manual-review.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { RetryService } from '../retry.service';
import { CreateSubscriptionUpdateMessageDto } from '@libs/dto/transfer/create-subscription-update-message.dto';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { v4 as uuidv4 } from 'uuid';

export class ProcessRecurringPaymentCommand {
  constructor(public readonly invoice: Stripe.Invoice) {}
}

@CommandHandler(ProcessRecurringPaymentCommand)
export class ProcessRecurringPaymentCommandHandler implements ICommandHandler<
  ProcessRecurringPaymentCommand,
  void
> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly outboxService: OutboxService,
    private readonly prisma: PrismaService,
    private readonly manualReviewService: ManualReviewService,
    private readonly logger: AppLoggerService,
    private readonly retryService: RetryService,
    private readonly stripeAdapter: StripeAdapter,
  ) {}

  async execute(command: ProcessRecurringPaymentCommand): Promise<void> {
    try {
      await this.retryService.executeWithRetry(async () => {
        const invoice = command.invoice;
        if (
          invoice.billing_reason === 'subscription_create' ||
          invoice.status !== 'paid'
        )
          return;

        const stripeSubscriptionId = invoice.parent.subscription_details
          .subscription as string;

        const subscription =
          await this.stripeAdapter.getSubscriptionDetails(stripeSubscriptionId);

        if (
          !subscription ||
          subscription.metadata?.extensionSub === 'true' ||
          subscription.status === 'canceled' ||
          subscription.cancel_at_period_end
        ) {
          return;
        }

        const existingPayment =
          await this.paymentsRepository.findByStripeSubscriptionId(
            stripeSubscriptionId,
          );

        if (!existingPayment || existingPayment.autoRenewal === false) {
          return;
        }

        const invoiceLine = invoice.lines.data[0];

        await this.prisma.$transaction(async (tx) => {
          const amount = invoice.amount_paid / 100;
          const currentPeriodStart = new Date(invoiceLine.period.start * 1000);
          const currentPeriodEnd = new Date(invoiceLine.period.end * 1000);
          const nextPaymentDate = currentPeriodEnd;
          const createdAt = new Date(invoice.created * 1000);

          const subscriptionType =
            invoice.metadata.subscriptionType ||
            existingPayment.subscriptionType;

          const finishDate = new Date(Date.now());
          const subscriptionId = uuidv4();
          const customPaymentId = `${existingPayment.profileId}-${finishDate.getTime()}`;

          const createPaymentData: CreatePaymentDomainDto = {
            paymentProvider: 'Stripe',
            currency: invoice.currency.toUpperCase(),
            amount,
            profileId: existingPayment.profileId,
            status: PaymentStatus.SUCCESSFUL,
            subscriptionId,
            stripeSubscriptionId,
            mainSubscriptionId: existingPayment.mainSubscriptionId,
            periodStart: currentPeriodStart,
            periodEnd: currentPeriodEnd,
            nextPaymentDate: nextPaymentDate,
            subscriptionType: subscriptionType,
            autoRenewal: existingPayment.autoRenewal,
            paymentsUrl: 'AutoRenewal',
            createdAt: new Date(),
            stripePaymentCreatedAt: createdAt,
            cancelledAt: null,
            customPaymentId,
          };

          await this.paymentsRepository.createPayment(createPaymentData, tx);

          await this.paymentsRepository.completePayment(
            existingPayment.customPaymentId,
            PaymentStatus.COMPLETED,
            false,
            finishDate,
            tx,
          );

          const createSubscriptionUpdateMessageData: CreateSubscriptionUpdateMessageDto =
            {
              subscriptionId,
              paymentId: customPaymentId,
              nextPaymentDate,
              profileId: existingPayment.profileId,
            };

          await this.outboxService.createSubscriptionUpdatedMessage(
            createSubscriptionUpdateMessageData,
            tx,
          );
        });
      });
    } catch (error) {
      try {
        await this.manualReviewService.createFailedRecurringPaymentTask(
          command.invoice,
          error,
        );
      } catch (error) {
        this.logger.error(
          `Critical error: failed to create manual review task for invoiceId: ${command.invoice.id}: ${error.message}`,
          error.stack,
          ProcessRecurringPaymentCommandHandler.name,
        );
      }
      throw error;
    }
  }
}
