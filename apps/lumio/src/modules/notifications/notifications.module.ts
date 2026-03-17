import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './application/notifications.gateway';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.repository';
import { NotificationsService } from './application/notifications.service';
import { NotificationsScheduler } from './application/notifications.scheduler';
import { NotificationQueryRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.query-repository';
import { UserAccountsModule } from '@lumio/modules/user-accounts/user-accounts.module';

import { NotificationsController } from '@lumio/modules/notifications/api/notifications.controller';
import { GetUserNotificationsQueryHandler } from '@lumio/modules/notifications/application/queries/get-user-notifications.query-handler';
import { GetUnreadCountQueryHandler } from '@lumio/modules/notifications/application/queries/get-unread-count.query-handler';
import { DeleteNotificationCommandHandler } from '@lumio/modules/notifications/application/commands/delete-notification.command.handler';
import { MarkNotificationsAsReadCommandHandler } from '@lumio/modules/notifications/application/commands/mark-notifications-as-read.command.handler';

const repositories = [NotificationRepository, NotificationQueryRepository];

const services = [NotificationsService, NotificationsScheduler];

const queryHandlers = [
  GetUserNotificationsQueryHandler,
  GetUnreadCountQueryHandler,
];

const commandHandlers = [
  MarkNotificationsAsReadCommandHandler,
  DeleteNotificationCommandHandler,
];

@Module({
  imports: [JwtModule, UserAccountsModule],
  controllers: [NotificationsController],
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
