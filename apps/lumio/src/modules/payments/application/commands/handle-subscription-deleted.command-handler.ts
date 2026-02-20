import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionRepository } from '../../domain/infrastructure/subscription.repository';
import { SubscriptionDeletedEvent } from '../../api/dto/transfer/subscription-deleted-event.dto';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { AccountType } from '@lumio/modules/payments/constants/payments-constans';

export class HandleSubscriptionDeletedCommand {
  constructor(public readonly data: SubscriptionDeletedEvent) {}
}

@CommandHandler(HandleSubscriptionDeletedCommand)
export class HandleSubscriptionDeletedCommandHandler implements ICommandHandler<HandleSubscriptionDeletedCommand> {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly userRepository: ExternalQueryUserAccountsRepository,
  ) {}

  async execute(command: HandleSubscriptionDeletedCommand): Promise<void> {
    const { subscriptionId } = command.data.payload;

    const subscription =
      await this.subscriptionRepository.findSubscriptionById(subscriptionId);

    if (!subscription) {
      return;
    }

    try {
      await this.subscriptionRepository.cancelSubscription(
        subscriptionId,
        new Date(command.data.payload.timestamp),
      );

      await this.userRepository.updateAccountType(
        command.data.payload.profileId,
        AccountType.PERSONAL,
      );
    } catch (error) {
      throw error;
    }
  }
}
