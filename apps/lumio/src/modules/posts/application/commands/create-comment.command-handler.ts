import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { CommentRepository } from '@lumio/modules/posts/domain/infrastructure/comment.repository';

export class CreateCommentCommand {
  constructor(
    public readonly userId: number,
    public readonly postId: string,
    public readonly content: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentCommandHandler implements ICommandHandler<
  CreateCommentCommand,
  { commentId: number }
> {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(command: CreateCommentCommand): Promise<{ commentId: number }> {
    const post = await this.commentRepository.findExistingAndActivePost(
      command.postId,
    );

    if (!post) {
      throw NotFoundDomainException.create('Post not found', 'postId');
    }

    return this.commentRepository.createComment(
      command.userId,
      command.postId,
      command.content,
    );
  }
}
