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
    pagination?: GetPostCommentsQueryDto,
    userId?: number,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const rootWhere = { postId, parentId: null, deletedAt: null };
    const skip = pagination?.calculateSkip() ?? 0;
    const take = pagination?.pageSize ?? 10;

    const [roots, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: rootWhere,
        skip,
        take,
        orderBy: pagination
          ? { [pagination.sortBy]: pagination.sortDirection }
          : { createdAt: 'desc' },
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
      this.prisma.comment.count({ where: rootWhere }),
    ]);

    if (roots.length === 0) {
      return PaginatedViewDto.mapToView({
        items: [],
        page: pagination?.pageNumber ?? 1,
        size: take,
        totalCount,
      });
    }

    const rootIds = roots.map((r) => r.id);
    const replies = await this.prisma.comment.findMany({
      where: { rootId: { in: rootIds }, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    });

    const userReactionsMap = new Map<number, 'like' | 'dislike'>();
    if (userId) {
      const allCommentIds = [...rootIds, ...replies.map((r) => r.id)];
      const userReactions = await this.prisma.commentLike.findMany({
        where: {
          userId,
          commentId: { in: allCommentIds },
        },
        select: {
          commentId: true,
          status: true,
        },
      });

      userReactions.forEach((reaction) => {
        userReactionsMap.set(
          reaction.commentId,
          reaction.status as 'like' | 'dislike',
        );
      });
    }

    const repliesMap = new Map<number, any[]>();
    replies.forEach((reply) => {
      const list = repliesMap.get(reply.rootId!) || [];
      list.push(reply);
      repliesMap.set(reply.rootId!, list);
    });

    const mappedComments: CommentViewDto[] = roots.map((root) => {
      const rootReplies = (repliesMap.get(root.id) || []).map((r) => {
        const reaction = userReactionsMap.get(r.id) ?? 'none';
        return CommentViewDto.fromPrismaRoot(r, [], reaction);
      });

      const rootReaction = userReactionsMap.get(root.id) ?? 'none';
      return CommentViewDto.fromPrismaRoot(root, rootReplies, rootReaction);
    });

    return PaginatedViewDto.mapToView({
      items: mappedComments,
      page: pagination?.pageNumber ?? 1,
      size: take,
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
