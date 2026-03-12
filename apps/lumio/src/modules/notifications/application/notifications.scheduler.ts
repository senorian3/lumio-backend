import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.repository';
import { NotificationsGateway } from '@lumio/modules/notifications/application/notifications.gateway';
import { Notification as PrismaNotification } from '@generated/prisma-lumio';
import { AppLoggerService } from '@libs/logger/logger.service';

@Injectable()
export class NotificationsScheduler {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly logger: AppLoggerService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processPendingNotifications() {
    try {
      const notifications: PrismaNotification[] =
        await this.notificationRepository.findPendingNotifications(100);

      if (notifications.length === 0) {
        return;
      }

      for (const notification of notifications) {
        try {
          await this.notificationsGateway.sendNotification(
            notification.userId,
            notification.title,
            notification.message,
          );

          await this.notificationRepository.markAsSent(notification.id);
        } catch (error) {
          await this.notificationRepository.markAsFailed(notification.id);
          this.logger.error(
            `Error in notifications scheduler for notification ${notification.id}: ${error.message}`,
            error.stack,
            NotificationsScheduler.name,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error in notifications scheduler: ${error.message}`,
        error.stack,
        NotificationsScheduler.name,
      );
    }
  }
}
