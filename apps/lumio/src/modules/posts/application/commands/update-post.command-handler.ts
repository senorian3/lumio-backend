import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { ExternalQueryUserRepository } from './../../../user-accounts/users/domain/infrastructure/user.external-query.repository';

export class UpdatePostCommand {
  constructor(
    public postId: number,
    public userId: number,
    public description: string,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostCommandHandler implements ICommandHandler<
  UpdatePostCommand,
  PostView
> {
  constructor(
    private readonly externalQueryUserRepository: ExternalQueryUserRepository,
    private readonly postRepository: PostRepository,
  ) {}

  async execute(command: UpdatePostCommand): Promise<PostView> {
    const user = await this.externalQueryUserRepository.findById(
      command.userId,
    );

    if (!user) {
      throw BadRequestDomainException.create('User does not exist', 'userId');
    }

    const post = await this.postRepository.findById(command.postId);

    if (!post || post.deletedAt !== null) {
      throw NotFoundDomainException.create('Post does not exist', 'post');
    }

    if (post.userId !== command.userId) {
      throw ForbiddenDomainException.create(
        'Post does not belong to the user',
        'post',
      );
    }

    const updatedPost = await this.postRepository.updateDescription(
      command.postId,
      command.description,
    );

    return PostView.fromPrisma(updatedPost);
  }
}
