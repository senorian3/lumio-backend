import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';
import { FilesHttpAdapter } from '@lumio/modules/posts/application/files-http.adapter';
export class UploadUserAvatarCommand {
  constructor(
    public readonly userId: number,
    public readonly avatar: Express.Multer.File,
  ) {}
}

@CommandHandler(UploadUserAvatarCommand)
export class UploadUserAvatarCommandHandler implements ICommandHandler<
  UploadUserAvatarCommand,
  { url: string }
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly filesHttpAdapter: FilesHttpAdapter,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(command: UploadUserAvatarCommand): Promise<{ url: string }> {
    const user = await this.userRepository.findUserById(command.userId);

    if (!user) {
      throw NotFoundDomainException.create('User does not exist', 'userId');
    }

    const userProfile = await this.userRepository.findUserProfileByUserId(
      command.userId,
    );

    if (userProfile.avatarUrl) {
      await this.filesHttpAdapter
        .deleteUserAvatar(command.userId)
        .catch((error) => {
          this.logger.error(
            `Critical error deleting avatar from Files microservice for user ${command.userId}: ${error.message}`,
            error?.stack,
            UploadUserAvatarCommandHandler.name,
          );
        });
    }

    const response = await this.filesHttpAdapter
      .uploadUserAvatar<any>(
        `${GLOBAL_PREFIX}/profile/upload-user-avatar`,
        command.userId,
        command.avatar,
      )
      .catch((error) => {
        throw error;
      });

    const avatarUrl = response.url;

    try {
      await this.userRepository.updateAvatarUrl(command.userId, avatarUrl);
      return { url: avatarUrl };
    } catch (error) {
      await this.filesHttpAdapter
        .deleteUserAvatar(command.userId)
        .catch((rollbackError) => {
          this.logger.error(
            `Critical error to rollback avatar upload for user ${command.userId}: ${rollbackError.message}`,
            rollbackError?.stack,
            UploadUserAvatarCommandHandler.name,
          );
        });

      throw error;
    }
  }
}
