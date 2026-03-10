import { Module } from '@nestjs/common';
import { NotificationsGateway } from './application/notifications.gateway';
import { CreateNotificationCommandHandler } from '@lumio/modules/notifications/application/commands/create-notification.command-handler';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.repository';

const repo = [NotificationRepository];

const useCases = [CreateNotificationCommandHandler];

@Module({
  imports: [],
  controllers: [],
  providers: [NotificationsGateway, ...repo, ...useCases],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
