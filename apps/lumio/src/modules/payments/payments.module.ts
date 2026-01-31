import { PaymentsController } from './api/payments.controller';
import { PaymentsRabbitMQController } from './api/payments-rabbitmq.controller';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { CreateSubscriptionPaymentUrlCommandHandler } from './application/commands/create-subscription.command-handler';
import { UpdateSubscriptionPeriodCommandHandler } from './application/commands/update-subscription-period.command-handler';
import { HandlePaymentCompletedCommandHandler } from './application/commands/handle-payment-completed.command-handler';
import { HandleSubscriptionCancelledCommandHandler } from './application/commands/handle-subscription-cancelled.command-handler';
import { HandleSubscriptionUpdatedCommandHandler } from './application/commands/handle-subscription-updated.command-handler';
import { LoggerModule } from '@libs/logger/logger.module';
import { PaymentsHttpAdapter } from './application/payments-http.adapter';
import { PaymentsAcknowledgmentService } from './application/payments-acknowledgment.service';
import { PaymentsRepository } from './domain/infrastructure/payments.repository';
import { SubscriptionRepository } from './domain/infrastructure/subscription.repository';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreConfig } from '../../core/core.config';

const useCases = [
  CreateSubscriptionPaymentUrlCommandHandler,
  UpdateSubscriptionPeriodCommandHandler,
  HandlePaymentCompletedCommandHandler,
  HandleSubscriptionCancelledCommandHandler,
  HandleSubscriptionUpdatedCommandHandler,
];

const services = [PaymentsAcknowledgmentService];

const adapters = [PaymentsHttpAdapter];

const repositories = [PaymentsRepository, SubscriptionRepository];

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
              type: 'direct',
              durable: true,
            },
            queue: 'lumio_to_payments_queue',
            queueOptions: {
              durable: true,
            },
            noAck: false,
          },
        }),
        inject: [CoreConfig],
      },
    ]),
  ],
  controllers: [PaymentsController, PaymentsRabbitMQController],
  providers: [...useCases, ...services, ...adapters, ...repositories],
})
export class PaymentsModule {}
