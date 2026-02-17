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
    let avatarUrl: string;

    try {
      const response = await this.filesHttpAdapter.uploadUserAvatar<any>(
        `${GLOBAL_PREFIX}/profile/upload-user-avatar`,
        command.userId,
        command.avatar,
      );

      avatarUrl = response.url;
    } catch (error) {
      throw error;
    }

    try {
      await this.userRepository.updateAvatarUrl(command.userId, avatarUrl);
      return { url: avatarUrl };
    } catch (error) {
      try {
        await this.filesHttpAdapter.deleteUserAvatar(command.userId);
      } catch (rollbackError) {
        this.logger.error(
          `Critical error to rollback avatar upload for user ${command.userId}: ${rollbackError.message}`,
          rollbackError?.stack,
          UploadUserAvatarCommandHandler.name,
        );
      }

      throw error;
    }
  }
}
