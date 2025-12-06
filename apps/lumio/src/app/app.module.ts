import { configModule } from '@libs/core/config-dynamic.module';
import { DynamicModule, Module } from '@nestjs/common';
import { MessagingModule } from '@libs/messaging/messaging.module';
import { CoreConfig } from '../core/core.config';
import { TestingModule } from '../features/tests/testing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CoreModule } from '../core/core.module';
import { TestMessagingController } from '../features/messaging/test-messaging.controller';
import { UserEventsPublisher } from '../features/messaging/user-events.publisher';
import { UserAccountsModule } from '../modules/user-accounts/user-accounts.module';
import { throttlerModule } from '../core/guards/throttler/throttler.module';

@Module({
  imports: [
    configModule,
    throttlerModule,
    PrismaModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        const uri = coreConfig.dbUrl;
        console.log('Connected to postgres');
        return { url: uri };
      },
      inject: [CoreConfig],
    }),
    CoreModule,
    MessagingModule,
    UserAccountsModule,
  ],
  controllers: [TestMessagingController],
  providers: [UserEventsPublisher],
})
export class AppModule {
  static async forRoot(coreConfig: CoreConfig): Promise<DynamicModule> {
    return {
      module: AppModule,
      imports: [...(coreConfig.includeTestingModule ? [TestingModule] : [])],
    };
  }
}
