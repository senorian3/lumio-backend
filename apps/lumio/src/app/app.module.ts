import { configModule } from '@libs/core/config-dynamic.module';
import { DynamicModule, Module } from '@nestjs/common';
import { CoreConfig } from '../core/core.config';
import { TestingModule } from '../modules/tests/testing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CoreModule } from '../core/core.module';
import { UserAccountsModule } from '../modules/user-accounts/user-accounts.module';
import { throttlerModule } from '../core/guards/throttler/throttler.module';
import { PostsModule } from '@lumio/modules/posts/posts.module';
import { AppLoggerService } from '@libs/logger/logger.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentsModule } from '@lumio/modules/payments/payments.module';

@Module({
  imports: [
    configModule,
    throttlerModule,
    PrismaModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        const logger = new AppLoggerService();
        const url = coreConfig.dbUrl;
        logger.log(`Connected to DB:${url}`, AppModule.name);
        return { url };
      },
      inject: [CoreConfig],
    }),
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

    CoreModule,
    UserAccountsModule,
    PostsModule,
    PaymentsModule,
  ],
})
export class AppModule {
  static async forRoot(coreConfig: CoreConfig): Promise<DynamicModule> {
    return {
      module: AppModule,
      imports: [...(coreConfig.includeTestingModule ? [TestingModule] : [])],
    };
  }
}
