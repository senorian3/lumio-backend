import { Stripe } from 'stripe';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '../../domain/infrastructure/payments.repository';
import { StripeAdapter } from '../stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { PaymentStatus } from '@payments/modules/subscriptions/constants/stripe-constants';
import { UpdatePaymentDomainDto } from '../../domain/dto/update-payment.domain.dto';
import { CreatePaymentCompleteMessageDto } from '@payments/modules/subscriptions/outbox/application/dto/create-payment-complete-message.dto';
import { RetryService } from '../retry.service';
import { ManualReviewService } from '../manual-review.service';

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
    private readonly retryService: RetryService,
    private readonly manualReviewService: ManualReviewService,
  ) {}

  async execute(command: ProcessInitialPaymentCommand): Promise<void> {
    const { session } = command;

    try {
      await this.retryService.executeWithRetry(
        () => this.processPaymentSession(session),
        { maxRetries: 5 },
      );
    } catch (error) {
      await this.manualReviewService.createFailedInitialPaymentTask(
        session,
        error,
      );
    }
  }

  private async processPaymentSession(session: Stripe.Checkout.Session) {
    if (!session.client_reference_id) {
      throw new Error('Отсутствует client_reference_id в сессии');
    }

    if (!session.subscription) {
      throw new Error('Отсутствует subscription ID в сессии');
    }

    const customPaymentId = session.metadata.customPaymentId;
    const subscriptionId = session.subscription.toString();

    const currentPayment =
      await this.paymentsRepository.findByCustomPaymentId(customPaymentId);

    if (!currentPayment) {
      this.logger.error(
        `Платеж с customPaymentId ${customPaymentId} не найден`,
        'ProcessInitialPayment',
        'findByCustomPaymentId',
      );
      throw new Error(`Платеж с customPaymentId ${customPaymentId} не найден`);
    }

    const profileId = currentPayment.profileId;
    const subscriptionType = currentPayment.subscriptionType;

    const activeSubscriptionsPayments =
      await this.paymentsRepository.findActiveSubscriptionPaymentsWithAutoRenewalByProfileId(
        profileId,
      );

    // Шаг 1: Транзакция с базой данных (все операции с БД)

    let currentPeriodStart: Date;
    let currentPeriodEnd: Date;

    try {
      let subscriptionDetails: Stripe.Subscription;

      try {
        subscriptionDetails =
          await this.stripeAdapter.getSubscriptionDetails(subscriptionId);
      } catch (error) {
        this.logger.error(error.message, error.stack, 'getSubscriptionDetails');
        throw new Error('Failed to retrieve subscription details');
      }

      currentPeriodStart = new Date(
        subscriptionDetails.billing_cycle_anchor * 1000,
      );

      let periodDuration: number;

      if (subscriptionType.includes('week')) {
        const weekCount = subscriptionType.includes('2') ? 2 : 1;
        periodDuration = weekCount * 7 * 24 * 60 * 60 * 1000;
      } else {
        periodDuration = 30 * 24 * 60 * 60 * 1000;
      }

      currentPeriodEnd = new Date(
        currentPeriodStart.getTime() + periodDuration,
      );

      if (subscriptionType === '1 month') {
        currentPeriodEnd = new Date(
          currentPeriodStart.getTime() + 30 * 24 * 60 * 60 * 1000,
        );
      }

      await this.prisma.$transaction(async (tx) => {
        for (const activeSubscriptionPayment of activeSubscriptionsPayments) {
          if (
            activeSubscriptionPayment.subscriptionId &&
            activeSubscriptionPayment.subscriptionId !== subscriptionId
          ) {
            await this.paymentsRepository.updatePaymentAutoRenewal(
              +activeSubscriptionPayment.subscriptionId,
              false,
              new Date(),
              tx,
            );
          }
        }

        const updatePaymentData: UpdatePaymentDomainDto = {
          customPaymentId,
          status: PaymentStatus.SUCCESSFUL,
          periodStart: currentPeriodStart,
          periodEnd: currentPeriodEnd,
          nextPaymentDate: currentPeriodEnd,
        };

        await this.paymentsRepository.updatePayment(updatePaymentData, tx);

        for (const subscription of activeSubscriptionsPayments) {
          if (
            subscription.subscriptionId &&
            subscription.subscriptionId !== subscriptionId
          ) {
            //Дописать RabbitMQ по отмене подписки
            await this.outboxService.createCancelSubscriptionMessage(
              customPaymentId,
              subscription.subscriptionId,
              tx,
            );
          }
        }

        const createPaymentData: CreatePaymentCompleteMessageDto = {
          paymentId: currentPayment.customPaymentId,
          profileId,
          amount: currentPayment.amount,
          currency: currentPayment.currency,
          subscriptionId,
          subscriptionType,
          periodStart: currentPeriodStart,
          periodEnd: currentPeriodEnd,
          timestamp: new Date().toISOString(),
        };

        await this.outboxService.createPaymentCompletedMessage(
          createPaymentData,
          tx,
        );
      });
    } catch (error) {
      this.logger.error(error.message, error.stack, 'processPaymentSession');
      throw new Error('Failed to create subscription');
    }

    this.logger.log(
      `Подписка ${subscriptionId} успешно создана для профиля ${profileId} с автопродлением`,
      'ProcessInitialPayment',
    );
  }
}
