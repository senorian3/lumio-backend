import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { HttpService } from '@lumio/modules/posts/application/http.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';

export class UploadUserAvatarCommand {
  constructor(
    public readonly userId: number,
    public readonly avatar: Express.Multer.File,
  ) {}
}

@CommandHandler(UploadUserAvatarCommand)
export class UploadUserAvatarCommandHandler implements ICommandHandler<
  UploadUserAvatarCommand,
  void
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly httpService: HttpService,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(command: UploadUserAvatarCommand): Promise<void> {
    const user = await this.userRepository.findUserById(command.userId);

    if (!user) {
      throw BadRequestDomainException.create('User does not exist', 'userId');
    }

    try {
      const formData = new FormData();
      formData.append('userId', command.userId.toString());

      const response = await this.httpService.uploadUserAvatar<any>(
        `${GLOBAL_PREFIX}/profile/upload-user-avatar`,
        command.userId,
        command.avatar,
      );

      const avatarUrl = response.url;

      await this.userRepository.updateAvatarUrl(command.userId, avatarUrl);
      return;
    } catch (error) {
      this.logger.error(
        `Avatar upload failed for user ${command.userId}`,
        error.stack || JSON.stringify(error),
        'UploadUserAvatarCommandHandler',
      );

      throw BadRequestDomainException.create('Failed to upload avatar', 'user');
    }
  }
}
