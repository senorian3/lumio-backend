import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { CommentRepository } from '@lumio/modules/posts/domain/infrastructure/comment.repository';
import { LikeStatus } from '../../api/dto/input/like-comment.input.dto';

export class LikeCommentCommand {
  constructor(
    public readonly userId: number,
    public readonly commentId: number,
    public readonly status: LikeStatus,
  ) {}
}

@CommandHandler(LikeCommentCommand)
export class LikeCommentCommandHandler implements ICommandHandler<
  LikeCommentCommand,
  void
> {
  constructor(private readonly commentRepository: CommentRepository) {}

  async execute(command: LikeCommentCommand): Promise<void> {
    const comment = await this.commentRepository.findActiveCommentById(
      command.commentId,
    );

    if (!comment) {
      throw NotFoundDomainException.create(
        'Comment not found or deleted',
        'commentId',
      );
    }

    const validStatuses: LikeStatus[] = ['like', 'dislike', 'none'];
    if (!validStatuses.includes(command.status)) {
      throw BadRequestDomainException.create(
        'Status must be "like", "dislike" or "none"',
        'status',
      );
    }

    await this.commentRepository.updateCommentLike(
      command.commentId,
      command.userId,
      command.status,
    );
  }
}
