import { PaymentsController } from './api/payments.controller';
import { PaymentsRabbitMQController } from './api/payments-rabbitmq.controller';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { CreateSubscriptionPaymentUrlCommandHandler } from './application/commands/create-subscription.command-handler';
import { HandlePaymentCompletedCommandHandler } from './application/commands/handle-payment-completed.command-handler';
import { HandleSubscriptionRecurringUpdatedCommandHandler } from './application/commands/handle-subscription-updated.command-handler';
import { HandleSubscriptionDeletedCommandHandler } from './application/commands/handle-subscription-deleted.command-handler';
import { LoggerModule } from '@libs/logger/logger.module';
import { PaymentsHttpAdapter } from './application/payments-http.adapter';
import { SubscriptionRepository } from './domain/infrastructure/subscription.repository';
import { IdempotencyKeyRepository } from './domain/infrastructure/idempotency-key.repository';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RabbitmqModule } from '../../core/rabbitmq.module';
import { DlqNotificationService } from './application/dlq-notification.service';
import { MessageProcessingService } from './application/message-processing.service';
import { ChangeAutoRenewalCommandHandler } from './application/commands/change-autorenewal.command.handler';
import { GetUserPaymentsQueryHandler } from '@lumio/modules/payments/application/queries/get-user-payments.query-handler';
import { GetUserSubscriptionQueryHandler } from './application/queries/get-user-subscription.query-handler';
import { NotificationsModule } from '@lumio/modules/notifications/notifications.module';
import { PaymentsScheduler } from './application/payments.scheduler';

const useCases = [
  CreateSubscriptionPaymentUrlCommandHandler,
  HandlePaymentCompletedCommandHandler,
  HandleSubscriptionRecurringUpdatedCommandHandler,
  HandleSubscriptionDeletedCommandHandler,
  ChangeAutoRenewalCommandHandler,
];

const queryHandlers = [
  GetUserPaymentsQueryHandler,
  GetUserSubscriptionQueryHandler,
];

const adapters = [PaymentsHttpAdapter];

const repositories = [SubscriptionRepository, IdempotencyKeyRepository];

const services = [DlqNotificationService, MessageProcessingService];

const schedulers = [PaymentsScheduler];

@Module({
  imports: [
    UserAccountsModule,
    LoggerModule,
    CqrsModule,
    NotificationsModule,
    RabbitmqModule,
  ],
  controllers: [PaymentsController, PaymentsRabbitMQController],
  providers: [
    ...useCases,
    ...adapters,
    ...repositories,
    ...services,
    ...queryHandlers,
    ...schedulers,
  ],
})
export class PaymentsModule {}
