import { Module } from '@nestjs/common';
import { NotificationsGateway } from './application/notifications.gateway';
import { CreateNotificationCommandHandler } from '@lumio/modules/notifications/application/commands/create-notification.command-handler';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.repository';
import { NotificationsService } from './application/notifications.service';

const repositories = [NotificationRepository];

const useCases = [CreateNotificationCommandHandler];

const services = [NotificationsService];

@Module({
  imports: [],
  controllers: [],
  providers: [NotificationsGateway, ...repositories, ...useCases, ...services],
  exports: [NotificationsService],
})
export class NotificationsModule {}
