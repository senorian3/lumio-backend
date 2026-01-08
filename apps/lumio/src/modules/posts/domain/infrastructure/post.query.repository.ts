import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';
import {
  GetPostsQueryParams,
  PostsSortBy,
} from '../../api/dto/input/get-all-user-posts.query.dto';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';

@Injectable()
export class QueryPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(postId: number): Promise<PostEntity | null> {
    return this.prisma.post.findFirst({
      where: { id: postId },
      include: {
        user: true,
        files: true,
      },
    });
  }

  async findUserPosts(
    userId: number,
    query: GetPostsQueryParams,
  ): Promise<any> {
    const whereOptions = { userId, deletedAt: null };
    const sortDirection = query.sortDirection === 'asc' ? 'asc' : 'desc';
    const sortBy = query.sortBy === PostsSortBy.CREATED_AT ? 'createdAt' : '';
    const orderOptions = { [sortBy]: sortDirection };

    const [posts, totalCount] = await Promise.all([
      this.prisma.post.findMany({
        where: whereOptions,
        skip: query.calculateSkip(),
        take: query.pageSize,
        orderBy: orderOptions,
        include: {
          files: true,
        },
      }),

      this.prisma.post.count({ where: whereOptions }),
    ]);

    return PaginatedViewDto.mapToView({
      items: posts,
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }
}
