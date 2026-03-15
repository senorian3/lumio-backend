import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { NotificationPaginationTransferDto } from '@lumio/modules/notifications/api/dto/transfer/notification-pagination.transfer.dto';

@Injectable()
export class NotificationQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(
    userId: number,
    pageNumber: number,
    pageSize: number,
    sortDirection: 'asc' | 'desc',
  ): Promise<NotificationPaginationTransferDto> {
    const limit = Math.min(Math.max(pageSize, 1), 100);
    const skip = (pageNumber - 1) * limit;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where = {
      userId,
      deletedAt: null,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: sortDirection,
        },
        select: {
          id: true,
          title: true,
          message: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.count({
        where,
      }),
    ]);

    const mappedItems = items.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      createdAt: item.createdAt,
    }));

    const pagesCount = Math.ceil(total / limit);

    return {
      items: mappedItems,
      total,
      pageNumber,
      pageSize: limit,
      pagesCount,
    };
  }
}
