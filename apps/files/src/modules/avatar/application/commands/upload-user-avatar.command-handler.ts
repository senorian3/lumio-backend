import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostFileEntity } from '@files/modules/post-files/domain/entities/post-file.entity';
import { ProfileRepository } from '@files/modules/avatar/domain/infrastructure/profile.repository';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';

export class UploadUserAvatarCommand {
  constructor(
    public readonly userId: number,
    public readonly avatar: Array<{ buffer: Buffer; originalname: string }>,
  ) {}
}

@CommandHandler(UploadUserAvatarCommand)
export class UploadUserAvatarCommandHandler implements ICommandHandler<
  UploadUserAvatarCommand,
  string
> {
  constructor(
    private readonly s3FilesHttpAdapter: S3FilesHttpAdapter,
    private readonly profileRepository: ProfileRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute({ userId, avatar }: UploadUserAvatarCommand): Promise<string> {
    const tempKey = `temp_${userId}_${Date.now()}`;

    const avatarRecord = await this.profileRepository.createUserAvatar({
      key: tempKey,
      url: '',
      mimetype: avatar[0].originalname,
      size: 0,
      userId,
    });

    let uploadedFiles: PostFileEntity[];
    try {
      uploadedFiles = await this.s3FilesHttpAdapter.uploadFiles(
        'users',
        userId,
        avatar,
      );
    } catch (error) {
      try {
        await this.profileRepository.deleteAvatar(avatarRecord.id);
      } catch (error) {
        this.logger.error(
          `Critical error to delete rollback avatar in DB for userId=${userId}: ${error.message}`,
          error?.stack,
          UploadUserAvatarCommandHandler.name,
        );
      }
      this.logger.error(
        `Failed to upload avatar to S3, rolled back DB for userId=${userId}: ${error.message}`,
        error?.stack,
        UploadUserAvatarCommandHandler.name,
      );
      throw error;
    }

    const file = uploadedFiles[0];

    await this.profileRepository.updateAvatar(avatarRecord.id, {
      key: file.key,
      url: file.url,
      mimetype: file.mimetype,
      size: file.size,
    });

    return file.url;
  }
}
