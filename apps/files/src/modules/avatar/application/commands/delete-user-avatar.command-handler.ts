import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProfileRepository } from '@files/modules/avatar/domain/infrastructure/profile.repository';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';

export class DeleteUserAvatarCommand {
  constructor(public readonly userId: number) {}
}

@CommandHandler(DeleteUserAvatarCommand)
export class DeleteUserAvatarCommandHandler implements ICommandHandler<
  DeleteUserAvatarCommand,
  void
> {
  constructor(
    private readonly s3FilesHttpAdapter: S3FilesHttpAdapter,
    private readonly profileRepository: ProfileRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute({ userId }: DeleteUserAvatarCommand): Promise<void> {
    const avatar = await this.profileRepository.getAvatarByUserId(userId);

    if (!avatar) {
      throw NotFoundDomainException.create('Avatar is not found', 'avatar');
    }

    try {
      await this.profileRepository.deleteAvatar(avatar.id);
    } catch (error) {
      this.logger.error(
        `Failed to delete avatar from DB for userId=${userId}: ${error.message}`,
        error?.stack,
        DeleteUserAvatarCommandHandler.name,
      );
      throw BadRequestDomainException.create(
        'Failed to delete avatar',
        'avatar',
      );
    }

    try {
      await this.s3FilesHttpAdapter.deleteFile(avatar.key);
    } catch (error) {
      this.logger.error(
        `Critical error to delete avatar file from S3 for userId=${userId}: ${error.message}`,
        error?.stack,
        DeleteUserAvatarCommandHandler.name,
      );
      throw BadRequestDomainException.create(
        'Failed to delete avatar',
        'avatar',
      );
    }
  }
}
