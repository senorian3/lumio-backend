import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import { AppLoggerService } from '@libs/logger/logger.service';

export class UpdateSubscriptionPeriodCommand {
  constructor(
    public readonly paymentId: number,
    public readonly subscriptionId: number,
    public readonly periodEnd: Date,
    public readonly nextPaymentDate: Date,
  ) {}
}

@CommandHandler(UpdateSubscriptionPeriodCommand)
export class UpdateSubscriptionPeriodCommandHandler implements ICommandHandler<
  UpdateSubscriptionPeriodCommand,
  void
> {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(command: UpdateSubscriptionPeriodCommand): Promise<void> {
    try {
      // Найдем подписку по paymentId
      const subscription =
        await this.subscriptionRepository.findSubscriptionById(
          command.subscriptionId,
        );

      if (!subscription) {
        this.logger.warn(
          `Subscription not found for payment ${command.paymentId}`,
          'UpdateSubscriptionPeriodCommandHandler',
        );
        return;
      }

      // Обновим период подписки через репозиторий
      await this.subscriptionRepository.updateSubscription(
        command.subscriptionId,
        subscription.durationType,
        command.periodEnd,
        command.nextPaymentDate > command.periodEnd,
      );

      this.logger.log(
        `Successfully updated subscription for payment ${command.paymentId}`,
        'UpdateSubscriptionPeriodCommandHandler',
      );
    } catch (error) {
      this.logger.error(
        `Failed to update subscription for payment ${command.paymentId}: ${error.message}`,
        error.stack,
        'UpdateSubscriptionPeriodCommandHandler',
      );
      throw error;
    }
  }
}
