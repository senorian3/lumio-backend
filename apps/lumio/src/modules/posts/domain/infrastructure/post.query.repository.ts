import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';
import {
  GetPostsQueryParams,
  PostsSortBy,
} from '../../api/dto/input/get-all-user-posts.query.dto';
import { GetPostCommentsQueryDto } from '../../api/dto/input/get-post-comments.query.dto';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { PostView } from '../../api/dto/output/post.output.dto';
import { CommentViewDto } from '@lumio/modules/posts/api/dto/output/comment.output.dto';

@Injectable()
export class QueryPostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(postId: string): Promise<PostEntity | null> {
    return this.prisma.post.findFirst({
      where: { id: postId },
      include: {
        user: true,
        files: true,
      },
    });
  }

  async exists(postId: string): Promise<boolean> {
    const count = await this.prisma.post.count({
      where: {
        id: postId,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  async findCommentsByPostId(
    postId: string,
    pagination: GetPostCommentsQueryDto,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const whereOptions = { postId, deletedAt: null };

    const orderBy = {
      [pagination.sortBy]: pagination.sortDirection,
    };

    const [comments, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: whereOptions,
        skip: pagination.calculateSkip(),
        take: pagination.pageSize,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.comment.count({ where: whereOptions }),
    ]);

    const mappedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
      createdAt: comment.createdAt,
      userId: comment.user.id,
      username: comment.user.username,
      avatarUrl: comment.user.profile?.avatarUrl ?? null,
    }));

    return PaginatedViewDto.mapToView({
      items: mappedComments,
      page: pagination.pageNumber,
      size: pagination.pageSize,
      totalCount,
    });
  }

  async findCommentById(commentId: number): Promise<any | null> {
    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        deletedAt: null,
      },
    });

    if (!comment) {
      return null;
    }

    return comment;
  }

  async findUserPosts(
    userId: number,
    query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostView[]>> {
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
