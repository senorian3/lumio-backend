import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { FilesHttpAdapter } from '@lumio/modules/posts/application/files-http.adapter';
export class DeleteUserAvatarCommand {
  constructor(public readonly userId: number) {}
}

@CommandHandler(DeleteUserAvatarCommand)
export class DeleteUserAvatarCommandHandler implements ICommandHandler<
  DeleteUserAvatarCommand,
  void
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly filesHttpAdapter: FilesHttpAdapter,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(command: DeleteUserAvatarCommand): Promise<void> {
    const user = await this.userRepository.findUserById(command.userId);

    if (!user) {
      throw NotFoundDomainException.create('User does not exist', 'userId');
    }

    const userProfile = await this.userRepository.findUserProfileByUserId(
      command.userId,
    );

    if (!userProfile.avatarUrl) {
      return;
    }

    await this.filesHttpAdapter
      .deleteUserAvatar(command.userId)
      .catch((error) => {
        this.logger.error(
          `Critical error deleting avatar from Files microservice for user ${command.userId}: ${error.message}`,
          error?.stack,
          DeleteUserAvatarCommandHandler.name,
        );
      });

    await this.userRepository
      .updateAvatarUrl(command.userId, null)
      .catch((error) => {
        throw error;
      });
  }
}
