import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AppLoggerService } from '@libs/logger/logger.service';
import { SubscriptionRepository } from '../../domain/infrastructure/subscription.repository';
import { PaymentsRepository } from '../../domain/infrastructure/payments.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

export interface SubscriptionUpdatedEvent {
  id: number;
  aggregateId: number;
  aggregateType: string;
  eventType: string;
  payload: {
    paymentId: number;
    createdAt: Date;
    amount: number;
    subscriptionId: number;
    subscriptionType: string;
    periodEnd: Date;
    nextPaymentDate: Date;
    timestamp: string;
  };
  timestamp: Date;
}

export class HandleSubscriptionUpdatedCommand {
  constructor(public readonly data: SubscriptionUpdatedEvent) {}
}

@CommandHandler(HandleSubscriptionUpdatedCommand)
export class HandleSubscriptionUpdatedCommandHandler implements ICommandHandler<HandleSubscriptionUpdatedCommand> {
  constructor(
    private readonly appLogger: AppLoggerService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentsRepository: PaymentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: HandleSubscriptionUpdatedCommand): Promise<void> {
    try {
      const data = command.data;

      // Найдем подписку по subscriptionId
      const subscription =
        await this.subscriptionRepository.findSubscriptionById(
          data.payload.subscriptionId,
        );

      if (!subscription) {
        this.appLogger.warn(
          `Subscription not found for payment ${data.payload.paymentId}`,
          'HandleSubscriptionUpdatedCommandHandler',
        );
        return;
      }

      // Найдем старый платеж по subscriptionId
      const oldPayment =
        await this.paymentsRepository.findPaymentBySubscriptionId(
          data.payload.subscriptionId,
        );

      if (!oldPayment) {
        this.appLogger.warn(
          `Payment not found for subscription ${data.payload.subscriptionId}`,
          'HandleSubscriptionUpdatedCommandHandler',
        );
        return;
      }

      // Создадим новый платеж и обновим подписку в транзакции
      const newPayment = await this.prisma.$transaction(async (tx) => {
        // Создадим новый платеж в транзакции
        const payment = await this.paymentsRepository.createPayment(
          {
            amount: data.payload.amount,
            paymentsService: data.payload.subscriptionType,
            userProfileId: oldPayment.userProfileId,
          },
          tx,
        );

        // Обновим подписку с новым ID платежа в транзакции
        await this.subscriptionRepository.updateSubscriptionWithNewPayment(
          data.payload.subscriptionId,
          payment.id,
          subscription.durationType,
          data.payload.periodEnd,
          data.payload.nextPaymentDate > data.payload.periodEnd,
          tx,
        );

        return payment;
      });

      this.appLogger.log(
        `Created new payment ${newPayment.id} for subscription ${data.payload.subscriptionId}`,
        'HandleSubscriptionUpdatedCommandHandler',
      );

      this.appLogger.log(
        `Successfully updated subscription ${data.payload.subscriptionId} with new payment ${newPayment.id}. Old payment ${oldPayment.id} remains in database.`,
        'HandleSubscriptionUpdatedCommandHandler',
      );

      this.appLogger.log(
        `Successfully processed subscription updated event: ${command.data.payload.paymentId}`,
        'PaymentsRabbitMQ',
      );
    } catch (error) {
      this.appLogger.error(
        `Error processing subscription updated event: ${error.message}`,
        error.stack,
        'PaymentsRabbitMQ',
      );
      throw error; // This will cause the message to be retried
    }
  }
}
