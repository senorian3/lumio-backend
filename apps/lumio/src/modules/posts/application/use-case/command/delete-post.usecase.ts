import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import axios from 'axios';
import { CoreConfig } from '@lumio/core/core.config';

export class DeletePostCommand {
  constructor(
    public readonly userId: number,
    public readonly postId: number,
  ) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<
  DeletePostCommand,
  void
> {
  constructor(
    private userRepository: UserRepository,
    private postRepository: PostRepository,
    private coreConfig: CoreConfig,
  ) {}

  async execute(command: DeletePostCommand): Promise<void> {
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

    await this.postRepository.softDeletePostById(command.postId);

    const filesFrontendUrl = this.coreConfig.filesFrontendUrl;
    const internalApiKey = this.coreConfig.internalApiKey;

    const fileIsDeleted = await axios.delete(
      `${filesFrontendUrl}/api/v1/files/delete-post-files/${command.postId}`,
      {
        headers: {
          'X-Internal-API-Key': internalApiKey,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!fileIsDeleted) {
      throw BadRequestDomainException.create('Files were not deleted', 'files');
    }
  }
}
