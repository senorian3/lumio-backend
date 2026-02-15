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

    let uploadedFiles: PostFileEntity[];

    try {
      uploadedFiles = await this.s3FilesHttpAdapter.uploadFiles(
        'users',
        userId,
        [fileData],
      );
    } catch (error) {
      this.logger.error(
        `Failed to upload avatar for userId=${userId}: ${error.message}`,
      );
      throw BadRequestDomainException.create(
        'Failed to upload avatar',
        'avatar',
      );
    }

    const file = uploadedFiles[0];

    try {
      await this.profileRepository.createUserAvatar({
        key: file.key,
        url: file.url,
        mimetype: file.mimetype,
        size: file.size,
        userId,
      });

      return file.url;
    } catch (error) {
      this.logger.error(
        `Critical error to upload avatar for userId=${userId}: ${error.message}, need to delete file from S3 ${file.key}`,
      );
      throw BadRequestDomainException.create(
        'Failed to upload avatar',
        'avatar',
      );
    }
  }
}
