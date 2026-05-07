import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalQueryPostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPostsByUserIds(
    userIds: number[],
    skip: number,
    take: number,
  ): Promise<{ posts: any[]; totalCount: number }> {
    const [posts, totalCount] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          userId: { in: userIds },
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          files: true,
        },
      }),
      this.prisma.post.count({
        where: {
          userId: { in: userIds },
          deletedAt: null,
        },
      }),
    ]);

    return { posts, totalCount };
  }

  async getPostsCountByUserId(userId: number): Promise<number> {
    return this.prisma.post.count({
      where: { userId, deletedAt: null },
    });
  }
}
