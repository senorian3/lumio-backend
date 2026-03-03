import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostFileEntity } from '@files/modules/post-files/domain/entities/post-file.entity';
import { ProfileRepository } from '@files/modules/avatar/domain/infrastructure/profile.repository';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

export class UploadUserAvatarCommand {
  constructor(
    public readonly userId: number,
    public readonly avatar: Express.Multer.File,
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
    if (!avatar) {
      throw BadRequestDomainException.create('Avatar file is required');
    }

    const fileData = {
      buffer: avatar.buffer,
      originalname: avatar.originalname,
    };

    const uploadedFiles: PostFileEntity[] = await this.s3FilesHttpAdapter
      .uploadFiles('users', userId, [fileData])
      .catch((error) => {
        throw error;
      });

    const file = uploadedFiles[0];

    const existingAvatar =
      await this.profileRepository.getAvatarByUserId(userId);

    if (existingAvatar) {
      await this.profileRepository
        .deleteAvatar(existingAvatar.id)
        .catch((error) => {
          this.logger.error(
            `Failed to delete old avatar record from database: ${existingAvatar.id}`,
            error?.stack,
            UploadUserAvatarCommandHandler.name,
          );
          throw error;
        });

      await this.s3FilesHttpAdapter
        .deleteFile(existingAvatar.key)
        .catch((error) => {
          this.logger.error(
            `Critical error, failed to delete old avatar file from S3: ${existingAvatar.key}`,
            error?.stack,
            UploadUserAvatarCommandHandler.name,
          );
        });
    }

    await this.profileRepository
      .createUserAvatar({
        key: file.key,
        url: file.url,
        mimetype: file.mimetype,
        size: file.size,
        userId,
      })
      .catch((error) => {
        throw error;
      });

    return file.url;
  }
}
