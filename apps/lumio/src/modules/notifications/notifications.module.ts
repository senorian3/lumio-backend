import { Module } from '@nestjs/common';
import { NotificationsGateway } from './application/notifications.gateway';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.repository';
import { NotificationsService } from './application/notifications.service';
import { NotificationsScheduler } from './application/notifications.scheduler';
import { NotificationQueryRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.query-repository';

const repositories = [NotificationRepository, NotificationQueryRepository];

const services = [NotificationsService, NotificationsScheduler];

@Module({
  imports: [],
  providers: [NotificationsGateway, ...repositories, ...services],
  exports: [NotificationsService],
})
export class NotificationsModule {}
