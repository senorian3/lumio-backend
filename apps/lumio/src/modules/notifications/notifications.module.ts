import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsGateway } from './application/notifications.gateway';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.repository';
import { NotificationsService } from './application/notifications.service';
import { NotificationsScheduler } from './application/notifications.scheduler';

const repositories = [NotificationRepository];

const services = [NotificationsService, NotificationsScheduler];

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [NotificationsGateway, ...repositories, ...services],
  exports: [NotificationsService],
})
export class NotificationsModule {}
