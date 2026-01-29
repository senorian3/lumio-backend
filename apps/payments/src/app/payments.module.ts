import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@libs/logger/logger.module';
import { CoreModule } from '@payments/core/core.module';
import { CoreConfig } from '@payments/core/core.config';
import { PrismaModule } from '@payments/prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SubscriptionPaymentsController } from '@payments/modules/subscription-payments/api/subscription-payments.controller';
import { PaymentsRabbitMQController } from '@payments/modules/subscription-payments/api/payments-rabbitmq.controller';
import { DlqAcknowledgmentController } from '@payments/modules/subscription-payments/api/dlq-acknowledgment.controller';
import { StripeService } from '@payments/modules/subscription-payments/adapters/stripe.service';
import { PaymentsRepository } from '@payments/modules/subscription-payments/domain/infrastructure/payments.repository';
import { SubscriptionCommandHandler } from '@payments/modules/subscription-payments/application/commands/subscription.command-handler';
import { StripeHookCommandHandler } from '@payments/modules/subscription-payments/application/commands/stripe-hook.command-handler';
import { OutboxRepository } from '@payments/modules/subscription-payments/domain/infrastructure/outbox.repository';
import { OutboxService } from '@payments/modules/subscription-payments/domain/infrastructure/outbox.service';
import { OutboxScheduler } from '@payments/modules/subscription-payments/domain/infrastructure/outbox.scheduler';
import { ExternalCallsProcessor } from '@payments/modules/subscription-payments/domain/infrastructure/external-calls.processor';
import { ScheduleModule } from '@nestjs/schedule';

const services = [StripeService];

const useCases = [SubscriptionCommandHandler, StripeHookCommandHandler];

const queryHandler = [];

const repository = [PaymentsRepository];

const queryRepository = [];

const outboxComponents = [
  OutboxRepository,
  OutboxService,
  OutboxScheduler,
  ExternalCallsProcessor,
];

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ClientsModule.registerAsync([
      {
        name: 'LUMIO_SERVICE',
        useFactory: (coreConfig: CoreConfig) => ({
          transport: Transport.RMQ,
          options: {
            urls: [coreConfig.rmqUrl],
            exchange: 'sub_payments_exchange',
            exchangeOptions: {
              type: 'direct',
              durable: true,
            },
            queue: 'payments_to_lumio_queue',
            queueOptions: {
              durable: true,
              deadLetterExchange: 'dlx_ack_exchange',
              deadLetterRoutingKey: 'dlq.acknowledgment',
              messageTtl: 300000,
            },
            noAck: true,
          },
        }),
        inject: [CoreConfig],
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    CoreModule,
    LoggerModule,
    PrismaModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => ({ url: coreConfig.dbUrl }),
      inject: [CoreConfig],
    }),
  ],

  controllers: [
    SubscriptionPaymentsController,
    PaymentsRabbitMQController,
    DlqAcknowledgmentController,
  ],
  providers: [
    ...services,
    ...useCases,
    ...queryHandler,
    ...repository,
    ...queryRepository,
    ...outboxComponents,
  ],
})
export class PaymentsModule {
  static forRoot(coreConfig: CoreConfig): DynamicModule {
    return {
      module: PaymentsModule,
      providers: [
        {
          provide: CoreConfig,
          useValue: coreConfig,
        },
      ],
    };
  }
}
