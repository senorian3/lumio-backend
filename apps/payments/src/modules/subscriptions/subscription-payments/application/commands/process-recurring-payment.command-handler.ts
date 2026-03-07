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
import { SubscriptionPeriodUtils } from '@payments/modules/subscriptions/shared/utils/subscription-period.utils';
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
        ) {
          return;
        }

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

        let mainSubscriptionPayment = null;

        const lastSubscriptionPayment =
          await this.paymentsRepository.findLastSubscriptionPaymentByStripeSubscriptionId(
            stripeSubscriptionId,
          );

        if (lastSubscriptionPayment.status === PaymentStatus.ACTIVE) {
          mainSubscriptionPayment = lastSubscriptionPayment;
        } else {
          mainSubscriptionPayment =
            await this.paymentsRepository.findActiveSubscriptionPaymentByProfileId(
              lastSubscriptionPayment.profileId,
            );
        }

        await this.prisma.$transaction(async (tx) => {
          const amount = invoice.amount_paid / 100;
          const currentPeriodStart = new Date(
            lastSubscriptionPayment.periodEnd.getTime(),
          );
          const currentPeriodEnd =
            SubscriptionPeriodUtils.calculateNextPaymentDate(
              currentPeriodStart,
              lastSubscriptionPayment.subscriptionType,
            );
          const nextPaymentDate = currentPeriodEnd;
          const createdAt = new Date(invoice.created * 1000);

          const subscriptionType =
            invoice.metadata.subscriptionType ||
            lastSubscriptionPayment.subscriptionType;

          const finishDate = new Date(Date.now());
          const subscriptionId = uuidv4();
          const customPaymentId = `${lastSubscriptionPayment.profileId}-${finishDate.getTime()}`;

          const createPaymentData: CreatePaymentDomainDto = {
            paymentProvider: 'Stripe',
            currency: invoice.currency.toUpperCase(),
            amount,
            profileId: lastSubscriptionPayment.profileId,
            status: PaymentStatus.ACTIVE,
            subscriptionId,
            stripeSubscriptionId,
            mainSubscriptionId: mainSubscriptionPayment.subscriptionId,
            periodStart: currentPeriodStart,
            periodEnd: currentPeriodEnd,
            nextPaymentDate: nextPaymentDate,
            subscriptionType,
            autoRenewal: mainSubscriptionPayment.autoRenewal,
            paymentsUrl: 'AutoRenewal',
            createdAt: new Date(),
            stripePaymentCreatedAt: createdAt,
            cancelledAt: null,
            customPaymentId,
          };

          await this.paymentsRepository.createPayment(createPaymentData, tx);

          await this.paymentsRepository.completePayment(
            mainSubscriptionPayment.customPaymentId,
            PaymentStatus.COMPLETED,
            finishDate,
            tx,
          );

          const createSubscriptionUpdateMessageData: CreateSubscriptionUpdateMessageDto =
            {
              subscriptionId,
              paymentId: customPaymentId,
              subscriptionType,
              nextPaymentDate,
              profileId: mainSubscriptionPayment.profileId,
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
