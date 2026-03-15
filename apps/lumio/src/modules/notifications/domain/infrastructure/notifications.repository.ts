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

  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
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
}
