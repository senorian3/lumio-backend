import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { CreateNotificationDto } from '@lumio/modules/notifications/api/dto/transfer/create-notification.transfer.dto';
import { NotificationStatus } from '@lumio/modules/notifications/constants/notification-constants';
import { Notification } from 'generated/prisma-lumio';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(data: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        executeAt: data.executeAt,
      },
    });
  }

  async markNotificationsAsRead(
    userId: number,
    notificationIds: string[],
  ): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
        deletedAt: null,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async softDelete(id: string, userId: number): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return result.count > 0;
  }

  async findPendingNotifications(limit: number = 100): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        deletedAt: null,
        executeAt: { lte: new Date() },
        status: NotificationStatus.PENDING,
      },
      orderBy: { executeAt: 'asc' },
      take: limit,
    });
  }

  async markAsSent(id: string) {
    await this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.SENT },
    });
  }

  async markAsFailed(id: string) {
    await this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.FAILED },
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
        deletedAt: null,
      },
    });
  }

  async findById(id: string, userId: number): Promise<Notification | null> {
    return this.prisma.notification.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });
  }

  async deleteOldNotifications(daysOld: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}
