import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { CommentRepository } from '@lumio/modules/posts/domain/infrastructure/comment.repository';

export class CreateCommentCommand {
  constructor(
    public readonly userId: number,
    public readonly postId: string,
    public readonly content: string,
    public readonly parentId?: number,
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

    if (command.parentId) {
      const parentComment = await this.commentRepository.findActiveCommentById(
        command.parentId,
      );

      if (!parentComment) {
        throw NotFoundDomainException.create(
          'Parent comment not found or deleted',
          'parentId',
        );
      }

      if (parentComment.postId !== command.postId) {
        throw BadRequestDomainException.create(
          'Parent comment does not belong to this post',
        );
      }
    }

    return this.commentRepository.createComment(
      command.userId,
      command.postId,
      command.content,
      command.parentId,
    );
  }
}
