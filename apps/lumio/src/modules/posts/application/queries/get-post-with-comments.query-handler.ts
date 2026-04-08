import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { CommentViewDto } from '@lumio/modules/posts/api/dto/output/comment.output.dto';
import { GetPostCommentsQueryDto } from '@lumio/modules/posts/api/dto/input/get-post-comments.query.dto';

export class GetPostWithCommentsQuery {
  constructor(
    public readonly postId: string,
    public readonly userId?: number,
    public readonly pagination?: GetPostCommentsQueryDto,
  ) {}
}

@QueryHandler(GetPostWithCommentsQuery)
export class GetPostWithCommentsQueryHandler implements IQueryHandler<
  GetPostWithCommentsQuery,
  PaginatedViewDto<CommentViewDto[]>
> {
  constructor(private readonly queryPostRepository: QueryPostRepository) {}

  async execute(
    query: GetPostWithCommentsQuery,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const postExists = await this.queryPostRepository.exists(query.postId);

    if (!postExists) {
      throw NotFoundDomainException.create('Post not found', 'postId');
    }

    return await this.queryPostRepository.findCommentsByPostId(
      query.postId,
      query.pagination,
      query.userId,
    );
  }
}
