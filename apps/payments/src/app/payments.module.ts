import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '@libs/logger/logger.module';
import { CoreModule } from '@payments/core/core.module';
import { CoreConfig } from '@payments/core/core.config';
import { PrismaModule } from '@payments/prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SubscriptionPaymentsController } from '@payments/modules/subscription-payments/api/subscription-payments.controller';
import { StripeService } from '@payments/modules/subscription-payments/adapters/stripe.service';
import { PaymentsRepository } from '@payments/modules/subscription-payments/domain/infrastructure/payments.repository';
import { SubscriptionCommandHandler } from '@payments/modules/subscription-payments/application/commands/subscription.command-handler';
import { StripeHookCommandHandler } from '@payments/modules/subscription-payments/application/commands/stripe-hook.command-handler';

const services = [StripeService];

const useCases = [SubscriptionCommandHandler, StripeHookCommandHandler];

const queryHandler = [];

const repository = [PaymentsRepository];

const queryRepository = [];

@Module({
  imports: [
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
            },
            noAck: false,
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
    ...services,
    ...useCases,
    ...queryHandler,
    ...repository,
    ...queryRepository,
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
