import { DynamicModule, Module } from '@nestjs/common';
import { CoreModule } from '@chat/core/core.module';
import { PrismaModule } from '@chat/prisma/prisma.module';
import { ChatsModule } from '@chat/modules/chats/chats.module';
import { TestingModule } from '@chat/modules/tests/testing.module';
import { CoreConfig } from '@chat/core/core.config';

@Module({
  imports: [CoreModule, PrismaModule, ChatsModule],
  providers: [],
})
export class AppModule {
  static forRoot(coreConfig: CoreConfig): DynamicModule {
    return {
      module: AppModule,
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
