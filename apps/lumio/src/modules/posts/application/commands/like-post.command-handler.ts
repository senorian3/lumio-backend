import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { LikePostStatus } from '../../api/dto/input/like-post.input.dto';

export class LikePostCommand {
  constructor(
    public readonly userId: number,
    public readonly postId: string,
    public readonly status: LikePostStatus,
  ) {}
}

@CommandHandler(LikePostCommand)
export class LikePostCommandHandler implements ICommandHandler<
  LikePostCommand,
  void
> {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(command: LikePostCommand): Promise<void> {
    const post = await this.postRepository.findActivePostById(command.postId);

    if (!post) {
      throw NotFoundDomainException.create(
        'Post not found or deleted',
        'postId',
      );
    }

    const validStatuses: LikePostStatus[] = ['like', 'dislike', 'none'];
    if (!validStatuses.includes(command.status)) {
      throw BadRequestDomainException.create(
        'Status must be "like", "dislike" or "none"',
        'status',
      );
    }

    await this.postRepository.updatePostLike(
      command.postId,
      command.userId,
      command.status,
    );
  }
}
