import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { GetUserNotificationsParams } from '@lumio/modules/notifications/api/dto/input/get-user-notifications.query';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { NotificationViewDto } from '@lumio/modules/notifications/api/dto/output/notification.output.dto';

@Injectable()
export class NotificationQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(
    userId: number,
    query: GetUserNotificationsParams,
  ): Promise<PaginatedViewDto<NotificationViewDto[]>> {
    const skip = (query.pageNumber - 1) * query.pageSize;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where = {
      userId,
      deletedAt: null,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: {
          createdAt: query.sortDirection,
        },
        select: {
          id: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.count({
        where,
      }),

      this.prisma.notification.count({
        where: {
          userId,
          deletedAt: null,
          isRead: false,
        },
      }),
    ]);

    const mappedItems: NotificationViewDto[] = items.map((item) => ({
      id: String(item.id),
      title: item.title,
      message: item.message,
      isRead: item.isRead,
      createdAt: item.createdAt,
    }));

    return PaginatedViewDto.mapToView<NotificationViewDto[]>({
      items: mappedItems,
      page: query.pageNumber,
      size: query.pageSize,
      unreadCount,
      totalCount: total,
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
