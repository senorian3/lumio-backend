import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { SubscriptionRepository } from '../../domain/infrastructure/subscription.repository';
import { SubscriptionDeletedEvent } from '../../api/dto/transfer/subscription-deleted-event.dto';

export class HandleSubscriptionDeletedCommand {
  constructor(public readonly data: SubscriptionDeletedEvent) {}
}

@CommandHandler(HandleSubscriptionDeletedCommand)
export class HandleSubscriptionDeletedCommandHandler implements ICommandHandler<HandleSubscriptionDeletedCommand> {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(command: HandleSubscriptionDeletedCommand): Promise<void> {
    try {
      await this.processSubscriptionDeleted(command.data);
    } catch (error) {
      this.appLogger.error(
        `Error processing subscription deleted event: ${error.message}`,
        error.stack,
        HandleSubscriptionDeletedCommand.name,
      );
      throw error;
    }
  }

  private async processSubscriptionDeleted(
    data: SubscriptionDeletedEvent,
  ): Promise<void> {
    const { subscriptionId } = data.payload;

    const subscription =
      await this.subscriptionRepository.findSubscriptionById(subscriptionId);

    if (!subscription) {
      return;
    }

    await this.subscriptionRepository.cancelSubscription(
      subscriptionId,
      new Date(data.payload.timestamp),
    );
  }
}
