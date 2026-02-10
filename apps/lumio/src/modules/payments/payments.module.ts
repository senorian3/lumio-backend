import { PaymentsController } from './api/payments.controller';
import { PaymentsRabbitMQController } from './api/payments-rabbitmq.controller';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { CreateSubscriptionPaymentUrlCommandHandler } from './application/commands/create-subscription.command-handler';
import { HandlePaymentCompletedCommandHandler } from './application/commands/handle-payment-completed.command-handler';
import { HandleSubscriptionCancelledCommandHandler } from './application/commands/handle-subscription-cancelled.command-handler';
import { HandleSubscriptionRecurringUpdatedCommand } from './application/commands/handle-subscription-updated.command-handler';
import { LoggerModule } from '@libs/logger/logger.module';
import { PaymentsHttpAdapter } from './application/payments-http.adapter';
import { PaymentsRepository } from './domain/infrastructure/payments.repository';
import { SubscriptionRepository } from './domain/infrastructure/subscription.repository';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreConfig } from '../../core/core.config';
import { IdempotencyService } from './application/idempotency.service';
import { DlqNotificationService } from './application/dlq-notification.service';
import { ChangeAutoRenewalCommandHandler } from './application/commands/change-autorenewal.command.handler';
import { QueryPaymentsRepository } from '@lumio/modules/payments/domain/infrastructure/payments.query-repository';

const useCases = [
  CreateSubscriptionPaymentUrlCommandHandler,
  HandlePaymentCompletedCommandHandler,
  HandleSubscriptionCancelledCommandHandler,
  HandleSubscriptionRecurringUpdatedCommand,
  ChangeAutoRenewalCommandHandler,
];

const adapters = [PaymentsHttpAdapter];

const repositories = [
  PaymentsRepository,
  SubscriptionRepository,
  QueryPaymentsRepository,
];

const services = [IdempotencyService, DlqNotificationService];

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
  providers: [...useCases, ...adapters, ...repositories, ...services],
})
export class PaymentsModule {}
