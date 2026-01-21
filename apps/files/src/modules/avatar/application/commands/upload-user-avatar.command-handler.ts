import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FilesService } from '@files/core/services/s3.service';
import { PostFileEntity } from '@files/modules/post-files/domain/entities/post-file.entity';
import { ProfileRepository } from '@files/modules/avatar/domain/infrastructure/profile.repository';
import { CreateUserAvatarDto } from '@files/modules/avatar/domain/dto/create-user-avatar.domain.dto';

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
    private readonly filesService: FilesService,
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute({ userId, avatar }: UploadUserAvatarCommand): Promise<string> {
    const uploadedFiles: PostFileEntity[] = await this.filesService.uploadFiles(
      'users',
      userId,
      avatar,
    );

    const file = uploadedFiles[0];
    if (!file) {
      throw new Error('Avatar upload failed: no file returned');
    }

    const dto: CreateUserAvatarDto = {
      key: file.key,
      url: file.url,
      mimetype: file.mimetype,
      size: file.size,
      userId: userId,
    };

    await this.profileRepository.createUserAvatar(dto);

    return file.url;
  }
}
