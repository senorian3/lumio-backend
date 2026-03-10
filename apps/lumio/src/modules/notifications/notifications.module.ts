import { Module } from '@nestjs/common';
import { NotificationsGateway } from './domain/notifications.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [NotificationsGateway],
  exports: [],
})
export class NotificationsModule {}
