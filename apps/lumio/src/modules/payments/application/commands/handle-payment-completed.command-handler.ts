import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { PaymentCompletedEvent } from '../../api/dto/transfer/payment-completed-event.dto';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { AccountType } from '@lumio/modules/payments/constants/payments-constans';
import { AppLoggerService } from '@libs/logger/logger.service';
import { NotificationsGateway } from '@lumio/modules/notifications/application/notifications.gateway';
import { NotificationType } from '@lumio/modules/notifications/constants/notification-constants';

export class HandlePaymentCompletedCommand {
  constructor(public readonly data: PaymentCompletedEvent) {}
}

@CommandHandler(HandlePaymentCompletedCommand)
export class HandlePaymentCompletedCommandHandler implements ICommandHandler<HandlePaymentCompletedCommand> {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly userRepository: ExternalQueryUserAccountsRepository,
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async execute(command: HandlePaymentCompletedCommand): Promise<void> {
    const {
      profileId,
      subscriptionId,
      subscriptionType,
      periodStart,
      periodEnd,
    } = command.data.payload;

    const profile = await this.userRepository.getProfileById(profileId);

    if (!profile) {
      throw NotFoundDomainException.create(
        'User profile dont exist',
        'profileId',
      );
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    try {
      await this.prisma.$transaction(async (tx) => {
        const existingSubscription =
          await this.subscriptionRepository.findSubscriptionByProfileId(
            profileId,
          );

        if (existingSubscription) {
          await this.subscriptionRepository.updateSubscriptionWithNewPayment(
            profileId,
            subscriptionType,
            endDate,
            subscriptionId,
            tx,
          );
        } else {
          await this.subscriptionRepository.createSubscription(
            {
              subscriptionId,
              durationType: subscriptionType,
              startDate,
              endDate,
              userProfileId: profileId,
              autoRenewal: true,
            },
            tx,
          );
        }

        await this.userRepository.updateAccountType(
          profileId,
          AccountType.BUSINESS,
          tx,
        );
      });

      //создаем задачу на создание уведомления котрое выполниться через 30 сек
      await this.notificationsGateway.sendNotification(profileId, {
        userId: profile.userId,
        type: NotificationType.SUBSCRIPTION_ACTIVE,
        title: `Подписка активирована`,
        message: `Ваша подписка активированна до ${endDate}`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to process payment completion. Profile: ${profileId}, Subscription: ${subscriptionId}, Error: ${error.messages}`,
        error.stack,
        HandlePaymentCompletedCommand.name,
      );
      throw error;
    }
  }
}
