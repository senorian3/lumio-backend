import { Module } from '@nestjs/common';
import { NotificationsGateway } from './application/notifications.gateway';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.repository';
import { NotificationsService } from './application/notifications.service';

const repositories = [NotificationRepository];

const useCases = [];

const services = [NotificationsService];

@Module({
  imports: [],
  controllers: [],
  providers: [NotificationsGateway, ...repositories, ...useCases, ...services],
  exports: [NotificationsService],
})
export class NotificationsModule {}
