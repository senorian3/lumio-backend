import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionRecurringUpdatedEvent } from '../../api/dto/transfer/subscription-recurring-updated-event.dto';
import { SubscriptionRepository } from '../../domain/infrastructure/subscription.repository';

export class HandleSubscriptionRecurringUpdatedCommand {
  constructor(public readonly data: SubscriptionRecurringUpdatedEvent) {}
}

@CommandHandler(HandleSubscriptionRecurringUpdatedCommand)
export class HandleSubscriptionRecurringUpdatedCommandHandler implements ICommandHandler<HandleSubscriptionRecurringUpdatedCommand> {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(
    command: HandleSubscriptionRecurringUpdatedCommand,
  ): Promise<void> {
    const subscription =
      await this.subscriptionRepository.findActiveSubscriptionByProfileId(
        command.data.payload.profileId,
      );

    if (!subscription) {
      return;
    }

    await this.subscriptionRepository
      .updateSubscriptionWithNewPayment(
        command.data.payload.profileId,
        command.data.payload.subscriptionType,
        command.data.payload.nextPaymentDate,
        command.data.payload.subscriptionId,
      )
      .catch((error) => {
        throw error;
      });
  }
}
