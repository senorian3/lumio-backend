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
          user: {
            include: {
              profile: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
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

  async getUsersReactionsForPosts(
    postIds: string[],
    userId: number,
  ): Promise<Map<string, 'like' | 'dislike'>> {
    const reactionsMap = new Map<string, 'like' | 'dislike'>();
    const userReactions = await this.prisma.postLike.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: {
        postId: true,
        status: true,
      },
    });
    userReactions.forEach((reaction) => {
      reactionsMap.set(reaction.postId, reaction.status as 'like' | 'dislike');
    });
    return reactionsMap;
  }
}
