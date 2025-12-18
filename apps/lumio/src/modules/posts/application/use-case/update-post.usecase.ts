import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';

export class UpdatePostCommand {
  constructor(
    public readonly userId: number,
    public readonly postId: number,
    public newDescription: string,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<
  UpdatePostCommand,
  void
> {
  constructor(
    private userRepository: UserRepository,
    private postRepository: PostRepository,
  ) {}

  async execute(command: UpdatePostCommand): Promise<void> {
    const user = await this.userRepository.findUserById(command.userId);
    if (!user) {
      throw BadRequestDomainException.create('User does not exist', 'user');
    }

    const post = await this.postRepository.findById(command.postId);
    if (!post) {
      throw BadRequestDomainException.create('Post does not exist', 'post');
    }

    if (post.userId !== command.userId) {
      throw ForbiddenDomainException.create(
        'Post does not belong to the user',
        'post',
      );
    }

    await this.postRepository.updateDescription(
      command.postId,
      command.newDescription,
    );
  }
}
