import { configModule } from '../../../libs/core/config-dynamic.module';
import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagingModule } from '../../../libs/messaging/messaging.module';
import { UserEventsPublisher } from './user-events.publisher';
import { TestMessagingController } from './test-messaging.controller';
import { CoreConfig } from './core/core.config';
import { TestingModule } from './features/tests/testing.module';
import { PrismaModule } from './prisma/prisma.module';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
    configModule,
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
  ],
  controllers: [AppController, TestMessagingController],
  providers: [AppService, UserEventsPublisher],
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
