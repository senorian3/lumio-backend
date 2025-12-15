import { configModule } from '@libs/core/config-dynamic.module';
import { DynamicModule, Module } from '@nestjs/common';
import { CoreConfig } from '../core/core.config';
import { TestingModule } from '../features/tests/testing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CoreModule } from '../core/core.module';
import { UserAccountsModule } from '../modules/user-accounts/user-accounts.module';
import { throttlerModule } from '../core/guards/throttler/throttler.module';
import { PostsModule } from '@lumio/modules/posts/posts.module';

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
    UserAccountsModule,
    PostsModule,
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
