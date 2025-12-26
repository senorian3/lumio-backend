import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { HttpService } from '../../http.service';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';
import { AppLoggerService } from '@libs/logger/logger.service';

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
    private readonly userRepository: UserRepository,
    private readonly postRepository: PostRepository,
    private readonly httpService: HttpService,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const user = await this.userRepository.findUserById(command.userId);
    if (!user) {
      throw BadRequestDomainException.create('User does not exist', 'user');
    }

    const post = await this.postRepository.findById(command.postId);

    if (!post) {
      throw NotFoundDomainException.create('Post does not exist', 'post');
    }

    if (post.userId !== command.userId) {
      throw ForbiddenDomainException.create(
        'Post does not belong to the user',
        'post',
      );
    }

    await this.postRepository.softDeletePostById(command.postId);

    try {
      await this.httpService.delete(
        `${GLOBAL_PREFIX}/files/delete-post-files/${command.postId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete files for postId=${command.postId}: ${error.message}`,
        error?.stack,
        DeletePostUseCase.name,
      );
      throw NotFoundDomainException.create('Failed to delete files', 'files');
    }
  }
}
