import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
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
      throw BadRequestDomainException.create('User does not exist', 'userId');
    }
    let avatarUrl: string;
    try {
      const response = await this.filesHttpAdapter.uploadUserAvatar<any>(
        `${GLOBAL_PREFIX}/profile/upload-user-avatar`,
        command.userId,
        command.avatar,
      );

      avatarUrl = response.url;
    } catch (error) {
      this.logger.error(
        `Avatar upload failed for user ${command.userId}`,
        error.stack,
        UploadUserAvatarCommand.name,
      );

      throw BadRequestDomainException.create(
        'Failed to upload avatar',
        'avatar',
      );
    }

    try {
      await this.userRepository.updateAvatarUrl(command.userId, avatarUrl);
      return { url: avatarUrl };
    } catch (error) {
      this.logger.error(
        `Avatar update failed for user ${command.userId}, rolling back uploaded file`,
        error?.stack,
        UploadUserAvatarCommand.name,
      );

      try {
        await this.filesHttpAdapter.deleteUserAvatar(command.userId);
        this.logger.log(
          `Successfully rolled back avatar upload for user ${command.userId}`,
          UploadUserAvatarCommandHandler.name,
        );
      } catch (rollbackError) {
        this.logger.error(
          `Critical error to rollback avatar upload for user ${command.userId}: ${rollbackError.message}`,
          rollbackError?.stack,
          UploadUserAvatarCommandHandler.name,
        );
      }

      throw BadRequestDomainException.create('Failed to upload avatar', 'user');
    }
  }
}
