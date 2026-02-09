import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import { PaymentsRepository } from '@lumio/modules/payments/domain/infrastructure/payments.repository';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';

export interface PaymentCompletedEvent {
  id: number;
  aggregateId: number;
  aggregateType: string;
  eventType: string;
  payload: {
    paymentId: string;
    profileId: number;
    amount: number;
    currency: string;
    subscriptionId: string;
    subscriptionType: string;
    periodStart: Date;
    periodEnd: Date;
    timestamp: string;
    paymentsService: string;
  };
  timestamp: Date;
}

export class HandlePaymentCompletedCommand {
  constructor(public readonly data: PaymentCompletedEvent) {}
}

@CommandHandler(HandlePaymentCompletedCommand)
export class HandlePaymentCompletedCommandHandler implements ICommandHandler<HandlePaymentCompletedCommand> {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly userRepository: ExternalQueryUserAccountsRepository,
  ) {}

  async execute(command: HandlePaymentCompletedCommand): Promise<void> {
    try {
      // Логируем входящую команду и данные
      this.appLogger.debug(
        `Received command: HandlePaymentCompletedCommand`,
        'PaymentsRabbitMQ',
      );

      await this.processPaymentCompleted(command.data);
    } catch (error) {
      this.appLogger.error(
        `Error processing payment completed event: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );
      throw error; // This will cause the message to be retried
    }
  }

  private async processPaymentCompleted(
    data: PaymentCompletedEvent,
  ): Promise<void> {
    const {
      profileId,
      amount,
      currency,
      subscriptionId,
      subscriptionType,
      periodStart,
      periodEnd,
      paymentsService,
    } = data.payload;

    const profile = await this.userRepository.getProfileById(profileId);

    if (!profile) {
      throw BadRequestDomainException.create(
        'User profile dont exist',
        'UserProfile',
      );
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    const subscription = await this.subscriptionRepository.createSubscription({
      subscriptionId,
      durationType: subscriptionType,
      startDate,
      endDate,
      userProfileId: profileId,
      autoRenewal: true,
    });

    await this.paymentsRepository.createPayment({
      amount,
      currency,
      paymentsService: paymentsService,
      subscriptionId: subscription.id,
    });

    await this.userRepository.updateAccountType(profileId, 'Business');

    this.appLogger.log(
      `Processing payment completed for payment ${data.payload.paymentId}`,
      'PaymentsRabbitMQ',
    );
  }
}
