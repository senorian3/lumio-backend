import { configModule } from '@libs/core/config-dynamic.module';
import { DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreConfig } from '../core/core.config';
import { TestingModule } from '@lumio/modules/features/tests/testing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CoreModule } from '../core/core.module';
import { UserAccountsModule } from '../modules/user-accounts/user-accounts.module';
import { throttlerModule } from '@lumio/modules/features/throttler/throttler.module';
import { PostsModule } from '@lumio/modules/posts/posts.module';
import { PaymentsModule } from '@lumio/modules/payments/payments.module';
import { SessionsModule } from '@lumio/modules/sessions/sessions.module';
import { HealthModule } from '@lumio/modules/features/health/health.module';
import { NotificationsModule } from '@lumio/modules/notifications/notifications.module';
import { UserFollowsModule } from '@lumio/modules/user-follows/user-follows.module';
import { HealthMonitoringModule } from '@lumio/modules/features/health-monitoring/health-monitoring.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    configModule,
    throttlerModule,
    NotificationsModule,
    HealthModule,
    HealthMonitoringModule,
    PrismaModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => ({
        url: coreConfig.dbUrl,
      }),
      inject: [CoreConfig],
    }),
    CoreModule,
    UserAccountsModule,
    PostsModule,
    PaymentsModule,
    SessionsModule,
    UserFollowsModule,
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
