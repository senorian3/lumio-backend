import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './application/notifications.gateway';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.repository';
import { NotificationsService } from './application/notifications.service';
import { NotificationsScheduler } from './application/notifications.scheduler';
import { NotificationQueryRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.query-repository';
import { UserAccountsModule } from '@lumio/modules/user-accounts/user-accounts.module';
import { NotificationsDocsController } from './api/notifications-docs.controller';
import { NotificationsController } from '@lumio/modules/notifications/api/notifications.controller';
import { MarkAllReadCommandHandler } from '@lumio/modules/notifications/application/commands/mark-all-as-read.command.handler';
import { GetUserNotificationsQueryHandler } from '@lumio/modules/notifications/application/queries/get-user-notifications.query-handler';

const repositories = [NotificationRepository, NotificationQueryRepository];

const services = [NotificationsService, NotificationsScheduler];

const queryHandlers = [GetUserNotificationsQueryHandler];

const commandHandlers = [MarkAllReadCommandHandler];

@Module({
  imports: [JwtModule, UserAccountsModule],
  controllers: [NotificationsDocsController, NotificationsController],
  providers: [
    NotificationsGateway,
    ...repositories,
    ...services,
    ...queryHandlers,
    ...commandHandlers,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
