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

        // Найти последнюю активную подписку пользователя
        const lastActiveSubscription =
          await this.paymentsRepository.findLastActiveSubscriptionByProfileId(
            currentPayment.profileId,
            customPaymentId,
          );

        // Найти main подписку (если указан mainSubscriptionId)
        const mainSubscription = mainSubscriptionId
          ? await this.paymentsRepository.findBySubscriptionId(
              mainSubscriptionId,
            )
          : null;

        // Если указан mainSubscriptionId, но подписка не найдена - это ошибка
        if (mainSubscriptionId && !mainSubscription) {
          throw new Error(
            `Main subscription with ID ${mainSubscriptionId} not found`,
          );
        }

        //изменить вместо get sub details просто класть в payment date время начала подписки (startdate)

        const subscriptionDetails: Stripe.Subscription =
          await this.stripeAdapter.getSubscriptionDetails(stripeSubscriptionId);

        // Определить startDate: если есть активная подписка, начинаем с её periodEnd
        const startDate = lastActiveSubscription
          ? lastActiveSubscription.periodEnd ||
            lastActiveSubscription.nextPaymentDate
          : new Date(subscriptionDetails.billing_cycle_anchor * 1000);

        const { periodStart, periodEnd } = this.calculatePeriodDates(
          startDate,
          currentPayment.subscriptionType,
        );

        const subscriptionId = uuidv4();

        await this.prisma.$transaction(async (tx) => {
          const hasActiveSubscription = !!lastActiveSubscription;

          const updatePaymentData: UpdatePaymentDomainDto = {
            customPaymentId,
            subscriptionId,
            stripeSubscriptionId,
            mainSubscriptionId,
            status: hasActiveSubscription
              ? PaymentStatus.EXTENSION
              : PaymentStatus.SUCCESSFUL,
            periodStart,
            periodEnd,
            nextPaymentDate: periodEnd,
            autoRenewal: hasActiveSubscription ? false : true,
          };

          //проверка на idempotency

          await this.paymentsRepository.updateCustomPaymentId(
            updatePaymentData,
            tx,
          );

          // Обновить periodEnd и nextPaymentDate у original main подписки (если есть)
          if (mainSubscription) {
            await this.paymentsRepository.updatePaymentSubscriptionPeriodDate(
              mainSubscription.customPaymentId,
              periodEnd,
              tx,
            );
          }

          // Если есть активная подписка, отменить её в Stripe
          if (lastActiveSubscription) {
            await this.outboxService.updateCustomerSubscriptionEndDateMessage(
              {
                stripeSubscriptionId,
                periodEndDate: periodEnd.getTime() / 1000 - 7 * 24 * 60 * 60,
                timestamp: new Date().toISOString(),
              },
              tx,
            );

            // Отменить последнюю активную подписку в Stripe
            await this.outboxService.createCancelSubscriptionImmediatelyMessage(
              {
                stripeSubscriptionId:
                  lastActiveSubscription.stripeSubscriptionId,
                timestamp: new Date().toISOString(),
              },
              tx,
            );
          }

          const createPaymentData: CreatePaymentCompleteMessageDto = {
            paymentId: customPaymentId,
            profileId: currentPayment.profileId,
            subscriptionId,
            mainSubscriptionId,
            // amount: currentPayment.amount,
            // currency: currentPayment.currency ,
            subscriptionType: lastActiveSubscription
              ? lastActiveSubscription.subscriptionType
              : currentPayment.subscriptionType,
            periodStart,
            periodEnd,
            // timestamp: new Date().toISOString(),
            // paymentsService: currentPayment.paymentProvider,
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
