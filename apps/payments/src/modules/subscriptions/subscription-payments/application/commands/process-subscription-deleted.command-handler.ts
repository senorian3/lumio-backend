import { Stripe } from 'stripe';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '../../domain/infrastructure/payments.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { CreateSubscriptionDeletedMessageDto } from '@libs/dto/transfer/create-subscription-deleted-message.dto';
import { RetryService } from '../retry.service';
import { ManualReviewService } from '../manual-review.service';
import { StripeAdapter } from '../stripe.adapter';

export class ProcessSubscriptionDeletedCommand {
  constructor(public readonly event: Stripe.Event) {}
}

@CommandHandler(ProcessSubscriptionDeletedCommand)
export class ProcessSubscriptionDeletedCommandHandler implements ICommandHandler<
  ProcessSubscriptionDeletedCommand,
  void
> {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly logger: AppLoggerService,
    private readonly outboxService: OutboxService,
    private readonly prisma: PrismaService,
    private readonly retryService: RetryService,
    private readonly manualReviewService: ManualReviewService,
    private readonly stripeAdapter: StripeAdapter,
  ) {}

  async execute(command: ProcessSubscriptionDeletedCommand): Promise<void> {
    const { event } = command;
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionId = subscription.id;

    try {
      const subscriptionDetails =
        await this.stripeAdapter.getSubscriptionDetails(subscriptionId);
      if (subscriptionDetails.metadata.cancelled_by === 'system') {
        this.logger.log(
          `Skipping webhook for subscription ${subscriptionId} - cancelled by system`,
          ProcessSubscriptionDeletedCommandHandler.name,
        );
        return;
      }

      await this.retryService.executeWithRetry(async () => {
        const payment =
          await this.paymentsRepository.findBySubscriptionId(subscriptionId);

        if (!payment) {
          this.logger.error(
            `Payment with subscriptionId ${subscriptionId} not found`,
            this.paymentsRepository.findBySubscriptionId.name,
            ProcessSubscriptionDeletedCommandHandler.name,
          );
          throw new Error();
        }

        const deleteSubscriptionData: CreateSubscriptionDeletedMessageDto = {
          subscriptionId,
          profileId: payment.profileId,
          timestamp: new Date().toISOString(),
        };

        await this.prisma.$transaction(async (tx) => {
          await this.paymentsRepository.cancelPayment(
            payment.customPaymentId,
            new Date(event.created * 1000),
            tx,
          );

          await this.outboxService.createSubscriptionDeletedMessage(
            deleteSubscriptionData,
            tx,
          );
        });
      });
    } catch (error) {
      this.logger.error(
        `Failed to process subscription deleted after retries: ${error.message}, subscriptionId: ${subscriptionId}`,
        error.stack,
        ProcessSubscriptionDeletedCommandHandler.name,
      );

      try {
        await this.manualReviewService.createFailedSubscriptionDeletedTask(
          subscriptionId,
          error,
        );
      } catch (innerError) {
        this.logger.error(
          `Critical error creating manual review task for subscription deleted ${subscriptionId}: ${innerError.message}`,
          innerError.stack,
          ProcessSubscriptionDeletedCommandHandler.name,
        );
      }

      throw BadRequestDomainException.create(
        'Something went wrong processing subscription deletion',
        'subscriptionId',
      );
    }
  }
}
