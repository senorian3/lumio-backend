import { PaymentsController } from './api/payments.controller';
import { PaymentsRabbitMQController } from './api/payments-rabbitmq.controller';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { CreateSubscriptionPaymentUrlCommandHandler } from './application/commands/create-subscription.command-handler';
import { LoggerModule } from '@libs/logger/logger.module';
import { PaymentsHttpAdapter } from './application/payments-http.adapter';
import { PaymentsAcknowledgmentService } from './application/payments-acknowledgment.service';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CoreConfig } from '../../core/core.config';

const useCases = [CreateSubscriptionPaymentUrlCommandHandler];

const services = [PaymentsAcknowledgmentService];

const adapters = [PaymentsHttpAdapter];

const repository = [];

const queryRepository = [];

@Module({
  imports: [
    UserAccountsModule,
    LoggerModule,
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
  providers: [
    ...useCases,
    ...services,
    ...adapters,
    ...repository,
    ...queryRepository,
  ],
})
export class PaymentsModule {}
