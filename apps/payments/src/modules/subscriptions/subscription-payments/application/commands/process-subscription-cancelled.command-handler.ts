import { Stripe } from 'stripe';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '../../domain/infrastructure/payments.repository';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { PaymentStatus } from '@payments/modules/subscriptions/constants/stripe-constants';
import { RetryService } from '../retry.service';
import { ManualReviewService } from '../manual-review.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

export class ProcessSubscriptionCancelledCommand {
  constructor(public readonly subscription: Stripe.Subscription) {}
}

@CommandHandler(ProcessSubscriptionCancelledCommand)
export class ProcessSubscriptionCancelledCommandHandler implements ICommandHandler<
  ProcessSubscriptionCancelledCommand,
  void
> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly outboxService: OutboxService,
    private readonly prisma: PrismaService,
    private readonly retryService: RetryService,
    private readonly manualReviewService: ManualReviewService,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(command: ProcessSubscriptionCancelledCommand): Promise<void> {
    const { subscription } = command;

    // try {
    //   await this.retryService.executeWithRetry(
    //     () => this.processSubscriptionCancellation(subscription),
    //     { maxRetries: 5 },
    //   );
    // } catch (error) {
    //   await this.manualReviewService.createFailedSubscriptionCancellationTask(
    //     subscription,
    //     error,
    //   );
    // }

    await this.processSubscriptionCancellation(subscription);
  }

  private async processSubscriptionCancellation(
    subscription: Stripe.Subscription,
  ) {
    const payment = await this.paymentsRepository.findBySubscriptionId(
      subscription.id,
    );

    if (!payment) {
      throw BadRequestDomainException.create(
        `Payment not found for subscription ${subscription.id}`,
      );
    }

    const cancelDate = new Date(Date.now());

    await this.prisma.$transaction(async (tx) => {
      await this.paymentsRepository.completePayment(
        payment.customPaymentId,
        PaymentStatus.CANCELLED,
        false,
        cancelDate,
        tx,
      );

      await this.outboxService.createSubscriptionCancelByUserMessage(
        payment.customPaymentId,
        subscription.id,
        tx,
      );
    });

    this.logger.log(
      `Подписка ${subscription.id} полностью завершена после окончания периода`,
      'ProcessSubscriptionCancelled',
    );
  }
}
