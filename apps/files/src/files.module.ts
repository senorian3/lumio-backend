import { DynamicModule, Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { MessagingModule } from '../../../libs/messaging/messaging.module';
import { UserEventsConsumer } from './user-events.consumer';
import { CoreConfig } from './core/core.config';
import { configModule } from 'libs/core/config-dynamic.module';
import { CoreModule } from './core/core.module';
import { PrismaModule } from './prisma/prisma.module';
import { TestingModule } from './features/tests/testing.module';

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
  controllers: [FilesController],
  providers: [FilesService, UserEventsConsumer],
  exports: [FilesService],
})
export class FilesModule {
  static async forRoot(coreConfig: CoreConfig): Promise<DynamicModule> {
    return {
      module: FilesModule,
      imports: [...(coreConfig.includeTestingModule ? [TestingModule] : [])],
    };
  }
}
