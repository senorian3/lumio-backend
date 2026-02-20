import { PaymentsController } from './api/payments.controller';
import { PaymentsRabbitMQController } from './api/payments-rabbitmq.controller';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { CreateSubscriptionPaymentUrlCommandHandler } from './application/commands/create-subscription.command-handler';
import { HandlePaymentCompletedCommandHandler } from './application/commands/handle-payment-completed.command-handler';
import { HandleSubscriptionRecurringUpdatedCommandHandler } from './application/commands/handle-subscription-updated.command-handler';
import { HandleSubscriptionDeletedCommandHandler } from './application/commands/handle-subscription-deleted.command-handler';
import { LoggerModule } from '@libs/logger/logger.module';
import { PaymentsHttpAdapter } from './application/payments-http.adapter';
import { PaymentsRepository } from './domain/infrastructure/payments.repository';
import { SubscriptionRepository } from './domain/infrastructure/subscription.repository';
import { IdempotencyKeyRepository } from './domain/infrastructure/idempotency-key.repository';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreConfig } from '../../core/core.config';
import { DlqNotificationService } from './application/dlq-notification.service';
import { MessageProcessingService } from './application/message-processing.service';
import { ChangeAutoRenewalCommandHandler } from './application/commands/change-autorenewal.command.handler';
import { QueryPaymentsRepository } from '@lumio/modules/payments/domain/infrastructure/payments.query-repository';
import { GetUserPaymentsQueryHandler } from '@lumio/modules/payments/application/queries/get-user-payments.query-handler';
import { GetUserSubscriptionQueryHandler } from './application/queries/get-user-subscription.query-handler';

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

const repositories = [
  PaymentsRepository,
  SubscriptionRepository,
  QueryPaymentsRepository,
  IdempotencyKeyRepository,
];

const services = [DlqNotificationService, MessageProcessingService];

@Module({
  imports: [
    UserAccountsModule,
    LoggerModule,
    CqrsModule,
    ClientsModule.registerAsync([
      {
        name: 'PAYMENTS_SERVICE',
        useFactory: (coreConfig: CoreConfig) => ({
          transport: Transport.RMQ,
          options: {
            urls: [coreConfig.rmqUrl],
            exchange: 'sub_payments_exchange',
            exchangeOptions: {
              type: 'topic',
              durable: true,
            },
            queue: 'lumio_to_payments_queue',
            queueOptions: {
              durable: true,
              deadLetterExchange: 'dlx_payments_exchange',
              deadLetterRoutingKey: 'dlq.payments',
              messageTtl: 300000,
            },
            noAck: true,
          },
        }),
        inject: [CoreConfig],
      },
    ]),
  ],
  controllers: [PaymentsController, PaymentsRabbitMQController],
  providers: [
    ...useCases,
    ...adapters,
    ...repositories,
    ...services,
    ...queryHandlers,
  ],
})
export class PaymentsModule {}
