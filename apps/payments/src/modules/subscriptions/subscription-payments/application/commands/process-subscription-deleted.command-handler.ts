import { Stripe } from 'stripe';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsRepository } from '../../domain/infrastructure/payments.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { CreateSubscriptionDeletedMessageDto } from '@libs/dto/transfer/create-subscription-deleted-message.dto';

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
  ) {}

  async execute(command: ProcessSubscriptionDeletedCommand): Promise<void> {
    const { event } = command;
    const subscription = event.data.object as Stripe.Subscription;

    const subscriptionId = subscription.id;

    let payment = null;

    try {
      payment =
        await this.paymentsRepository.findBySubscriptionId(subscriptionId);

      if (!payment) {
        return;
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
    } catch (error) {
      this.logger.error(
        `Error processing subscription deleted for ${subscriptionId}: ${error.message}`,
        error.stack,
        ProcessSubscriptionDeletedCommandHandler.name,
      );

      throw BadRequestDomainException.create(
        'Something went wrong processing subscription deletion',
        'subscriptionId',
      );
    }
  }
}
