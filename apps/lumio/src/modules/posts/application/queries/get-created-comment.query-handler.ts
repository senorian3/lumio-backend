import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { CommentViewDto } from '../../api/dto/output/comment.output.dto';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

export class GetCreatedCommentQuery {
  constructor(
    public readonly commentId: number,
    public readonly userId: number,
  ) {}
}

@QueryHandler(GetCreatedCommentQuery)
export class GetCreatedCommentQueryHandler implements IQueryHandler<
  GetCreatedCommentQuery,
  CommentViewDto
> {
  constructor(private readonly queryPostRepository: QueryPostRepository) {}

  async execute(query: GetCreatedCommentQuery): Promise<CommentViewDto> {
    const comment = await this.queryPostRepository.findCommentById(
      query.commentId,
    );

    if (!comment) {
      throw BadRequestDomainException.create('Comment not found', 'commentId');
    }

    return comment;
  }
}
