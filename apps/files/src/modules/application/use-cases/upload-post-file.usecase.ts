import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FileRepository } from '@files/modules/domain/infrastructure/file.repository';
import { FilesService } from '../s3.service';
import { PostFileEntity } from '@files/modules/domain/entities/post-file.entity';

export class UploadFilesCreatedPostCommand {
  constructor(
    public readonly postId: number,
    public readonly files: Array<{ buffer: Buffer; originalname: string }>,
  ) {}
}

@CommandHandler(UploadFilesCreatedPostCommand)
export class UploadFilesCreatedPostUseCase implements ICommandHandler<
  UploadFilesCreatedPostCommand,
  void
> {
  constructor(
    private filesService: FilesService,
    private fileRepository: FileRepository,
  ) {}

  async execute({
    postId,
    files,
  }: UploadFilesCreatedPostCommand): Promise<void> {
    const uploadedFiles: PostFileEntity[] = await this.filesService.uploadFiles(
      postId,
      files,
    );

    for (const file of uploadedFiles) {
      await this.fileRepository.createFile({
        key: file.key,
        url: file.url,
        mimetype: file.mimetype,
        size: file.size,
        postId,
      });
    }
  }
}
