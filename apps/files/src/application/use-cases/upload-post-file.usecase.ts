import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FilesService } from '@files/application/s3.service';
import { FileRepository } from '@files/domain/infrastructure/file.repository';
import { PostFileEntity } from '@files/domain/entities/post-file.entity';

export class UploadFilesCreatedPostCommand {
  constructor(
    public readonly userId: number,
    public readonly postId: number,
    public readonly files: Array<{ buffer: Buffer; originalname: string }>,
  ) {}
}

@CommandHandler(UploadFilesCreatedPostCommand)
export class UploadFilesCreatedPostUseCase implements ICommandHandler<
  UploadFilesCreatedPostCommand,
  number[]
> {
  constructor(
    private filesService: FilesService,
    private fileRepository: FileRepository,
  ) {}

  async execute({
    userId,
    postId,
    files,
  }: UploadFilesCreatedPostCommand): Promise<number[]> {
    const uploadedFiles = await this.filesService.uploadFiles(
      userId,
      postId,
      files,
    );

    for (const file of uploadedFiles) {
      const created: PostFileEntity = await this.fileRepository.createFile({
        key: file.key,
        url: file.url,
        mimetype: file.mimeType,
        size: file.size,
        userId,
        postId,
      });
    }

    return uploadedFiles;
  }
}
