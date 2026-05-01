import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { LoggerModule } from '@libs/logger/logger.module';
import { CoreModule } from '@super-admin/core/core.module';
import { GraphqlConfigModule } from '@super-admin/core/graphql-config.module';
import { CoreConfig } from '@super-admin/core/core.config';
import { PrismaModule } from '@super-admin/prisma/prisma.module';
import { HealthModule } from '@super-admin/modules/health/health.module';
import { UsersModule } from '@super-admin/modules/users/users.module';
import { PostsModule } from '@super-admin/modules/posts/posts.module';
import { AuthModule } from '@super-admin/modules/auth/auth.module';

@Module({
  imports: [
    CqrsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    PostsModule,
    AuthModule,
    GraphqlConfigModule,
    LoggerModule,
    CoreModule,
    PrismaModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => ({ url: coreConfig.dbUrl }),
      inject: [CoreConfig],
    }),
    HealthModule,
  ],
})
export class SuperAdminModule {
  static forRoot(coreConfig: CoreConfig): DynamicModule {
    return {
      module: SuperAdminModule,
      providers: [
        {
          provide: CoreConfig,
          useValue: coreConfig,
        },
      ],
    };
  }
}
