import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';
import { AppLoggerService } from '@libs/logger/logger.service';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { FilesHttpAdapter } from '../files-http.adapter';

export class DeletePostCommand {
  constructor(
    public readonly userId: number,
    public readonly postId: string,
  ) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostCommandHandler implements ICommandHandler<
  DeletePostCommand,
  void
> {
  constructor(
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
    private readonly postRepository: PostRepository,
    private readonly filesHttpAdapter: FilesHttpAdapter,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(command: DeletePostCommand): Promise<void> {
    const user = await this.externalQueryUserAccountsRepository.findUserId(
      command.userId,
    );
    if (!user) {
      throw NotFoundDomainException.create('User does not exist', 'user');
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

    try {
      await this.postRepository.softDeletePostById(command.postId);
    } catch (error) {
      throw error;
    }

    try {
      await this.filesHttpAdapter.delete(
        `${GLOBAL_PREFIX}/files/delete-post-files/${command.postId}`,
      );
    } catch (error) {
      this.logger.error(
        `Critical error to delete files for postId=${command.postId}: ${error.message}, need to delete files: ${post.files.map(
          (file) => file.id,
        )}`,
        error?.stack,
        DeletePostCommandHandler.name,
      );
      throw error;
    }
  }
}
