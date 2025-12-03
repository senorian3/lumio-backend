import { configModule } from '../../../libs/core/config-dynamic.module';
import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagingModule } from '../../../libs/messaging/messaging.module';
import { CoreConfig } from './core/core.config';
import { TestingModule } from './features/tests/testing.module';
import { PrismaModule } from './prisma/prisma.module';
import { CoreModule } from './core/core.module';
import { TestMessagingController } from './features/messaging/test-messaging.controller';
import { UserEventsPublisher } from './features/messaging/user-events.publisher';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { UserAccountsConfig } from './modules/user-accounts/config/user-accounts.config';
import { throttlerModule } from './core/guards/throttler/throttler.module';
import { DevicesModule } from './modules/devices/devices.module';

@Module({
  imports: [
    configModule,
    throttlerModule,
    PrismaModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        const uri = coreConfig.dbUrl;
        console.log('DB_URL', uri);
        return { url: uri };
      },
      inject: [CoreConfig],
    }),
    CoreModule,
    MessagingModule,
    UserAccountsModule,
    DevicesModule,
  ],
  controllers: [AppController, TestMessagingController],
  providers: [AppService, UserEventsPublisher, UserAccountsConfig],
  exports: [],
})
export class AppModule {
  static async forRoot(coreConfig: CoreConfig): Promise<DynamicModule> {
    return {
      module: AppModule,
      imports: [...(coreConfig.includeTestingModule ? [TestingModule] : [])],
    };
  }
}
