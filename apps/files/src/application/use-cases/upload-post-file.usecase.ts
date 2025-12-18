import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FilesService } from '@files/application/s3.service';
import { FileRepository } from '@files/domain/infrastructure/file.repository';

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
    const uploadedFiles = await this.filesService.uploadFiles(postId, files);

    for (const file of uploadedFiles) {
      await this.fileRepository.createFile({
        key: file.key,
        url: file.url,
        mimetype: file.mimeType,
        size: file.size,
        postId,
      });
    }

    return;
  }
}
