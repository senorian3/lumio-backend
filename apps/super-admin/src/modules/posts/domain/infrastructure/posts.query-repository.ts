import { PrismaService } from '@super-admin/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { PostSortBy } from '@super-admin/modules/posts/domain/schema/post/post-sort-by.enum';

@Injectable()
export class PostsQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPosts(
    page: number,
    pageSize: number,
    sortBy: PostSortBy,
    search?: string,
  ): Promise<any[]> {
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          deletedAt: null,
          user: {
            username: {
              contains: search,
            },
          },
        }
      : {
          deletedAt: null,
        };

    const orderBy = this.getOrderBy(sortBy);

    const posts = await this.prisma.post.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        user: true,
        files: {
          where: { deletedAt: null },
        },
      },
    });

    return posts;
  }

  async countPosts(search?: string): Promise<number> {
    const where = search
      ? {
          deletedAt: null,
          user: {
            username: {
              contains: search,
            },
          },
        }
      : {
          deletedAt: null,
        };

    return this.prisma.post.count({ where });
  }

  private getOrderBy(sortBy: PostSortBy) {
    switch (sortBy) {
      case PostSortBy.DATE_ASC:
        return { createdAt: 'asc' as const };
      case PostSortBy.DATE_DESC:
        return { createdAt: 'desc' as const };
      case PostSortBy.USERNAME_ASC:
        return { user: { username: 'asc' as const } };
      case PostSortBy.USERNAME_DESC:
        return { user: { username: 'desc' as const } };
      default:
        return { createdAt: 'desc' as const };
    }
  }
}
