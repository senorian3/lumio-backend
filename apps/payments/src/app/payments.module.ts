import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@libs/logger/logger.module';
import { CoreModule } from '@payments/core/core.module';
import { RabbitmqModule } from '@payments/core/rabbitmq.module';
import { CoreConfig } from '@payments/core/core.config';
import { PrismaModule } from '@payments/prisma/prisma.module';
import { CqrsModule } from '@nestjs/cqrs';
import { SubscriptionPaymentsController } from '@payments/modules/subscriptions/subscription-payments/api/subscription-payments.controller';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { CreateSubscriptionPaymentCommandHandler } from '@payments/modules/subscriptions/subscription-payments/application/commands/create-payment.command-handler';
import { ChangeAutoRenewalSubscriptionCommandHandler } from '@payments/modules/subscriptions/subscription-payments/application/commands/change-subscription-autorenewal.command-handler';
import { StripeHookCommandHandler } from '@payments/modules/subscriptions/subscription-payments/application/commands/stripe-hook.command-handler';
import { ProcessInitialPaymentCommandHandler } from '@payments/modules/subscriptions/subscription-payments/application/commands/process-initial-payment.command-handler';
import { ProcessRecurringPaymentCommandHandler } from '@payments/modules/subscriptions/subscription-payments/application/commands/process-recurring-payment.command-handler';
import { ProcessSubscriptionDeletedCommandHandler } from '@payments/modules/subscriptions/subscription-payments/application/commands/process-subscription-deleted.command-handler';
import { GetUserProfilePaymentsQueryHandler } from '@payments/modules/subscriptions/subscription-payments/application/queries/get-user-profile-payments.query-handler';
import { RetryService } from '@payments/modules/subscriptions/subscription-payments/application/retry.service';
import { ManualReviewService } from '@payments/modules/subscriptions/subscription-payments/application/manual-review.service';
import { OutboxRepository } from '@payments/modules/subscriptions/outbox/domain/outbox.repository';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { OutboxScheduler } from '@payments/modules/subscriptions/outbox/application/outbox.scheduler';
import { ExternalCallsProcessor } from '@payments/modules/subscriptions/outbox/application/external-calls.processor';
import { ScheduleModule } from '@nestjs/schedule';
import { TestingModule } from '@payments/modules/tests/testing.module';
import { GetAllPaymentsHandler } from '@payments/modules/subscriptions/subscription-payments/application/queries/get-all-payments.query-handler';
import { QueryPaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.query-repository';

const adapters = [StripeAdapter];

const useCases = [
  StripeHookCommandHandler,
  CreateSubscriptionPaymentCommandHandler,
  ProcessInitialPaymentCommandHandler,
  ProcessRecurringPaymentCommandHandler,
  ProcessSubscriptionDeletedCommandHandler,
  ChangeAutoRenewalSubscriptionCommandHandler,
  GetUserProfilePaymentsQueryHandler,
];

const repositories = [PaymentsRepository, QueryPaymentsRepository];

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
    RabbitmqModule,
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
    GetAllPaymentsHandler,
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
      imports: coreConfig.includeTestingModule ? [TestingModule] : [],
    };
  }
}
