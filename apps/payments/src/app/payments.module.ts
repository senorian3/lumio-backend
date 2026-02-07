import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@libs/logger/logger.module';
import { CoreModule } from '@payments/core/core.module';
import { CoreConfig } from '@payments/core/core.config';
import { PrismaModule } from '@payments/prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CqrsModule } from '@nestjs/cqrs';
import { SubscriptionPaymentsController } from '@payments/modules/subscriptions/subscription-payments/api/subscription-payments.controller';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { CreateSubscriptionPaymentCommandHandler } from '@payments/modules/subscriptions/subscription-payments/application/commands/create-payment.command-handler';
import { ChangeAutoRenewalSubscriptionCommandHandler } from '@payments/modules/subscriptions/subscription-payments/application/commands/change-subscription-autorenewal.command-handler';
import { StripeHookCommandHandler } from '@payments/modules/subscriptions/subscription-payments/application/commands/stripe-hook.command-handler';
import { ProcessInitialPaymentCommandHandler } from '@payments/modules/subscriptions/subscription-payments/application/commands/process-initial-payment.command-handler';
import { ProcessRecurringPaymentCommandHandler } from '@payments/modules/subscriptions/subscription-payments/application/commands/process-recurring-payment.command-handler';
import { RetryService } from '@payments/modules/subscriptions/subscription-payments/application/retry.service';
import { ManualReviewService } from '@payments/modules/subscriptions/subscription-payments/application/manual-review.service';
import { OutboxRepository } from '@payments/modules/subscriptions/outbox/domain/outbox.repository';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { OutboxScheduler } from '@payments/modules/subscriptions/outbox/application/outbox.scheduler';
import { ExternalCallsProcessor } from '@payments/modules/subscriptions/outbox/application/external-calls.processor';
import { ScheduleModule } from '@nestjs/schedule';

const adapters = [StripeAdapter];

const useCases = [
  StripeHookCommandHandler,
  CreateSubscriptionPaymentCommandHandler,
  ProcessInitialPaymentCommandHandler,
  ProcessRecurringPaymentCommandHandler,
  ChangeAutoRenewalSubscriptionCommandHandler,
];

const repositories = [PaymentsRepository];

const outboxComponents = [
  OutboxRepository,
  OutboxService,
  OutboxScheduler,
  ExternalCallsProcessor,
];

const services = [RetryService, ManualReviewService];

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CqrsModule,
    ClientsModule.registerAsync([
      {
        name: 'LUMIO_SERVICE',
        useFactory: (coreConfig: CoreConfig) => ({
          transport: Transport.RMQ,
          options: {
            urls: [coreConfig.rmqUrl],
            exchange: 'sub_payments_exchange',
            exchangeOptions: {
              type: 'topic',
              durable: true,
            },
            queue: 'payments_to_lumio_queue',
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

  controllers: [SubscriptionPaymentsController],
  providers: [
    ...adapters,
    ...useCases,
    ...repositories,
    ...outboxComponents,
    ...services,
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
