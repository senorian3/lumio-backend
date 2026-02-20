import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { S3FilesHttpAdapter } from '../../../../core/adapters/s3-files-http.adapter';
import { FileRepository } from '../../domain/infrastructure/file.repository';
import { AppLoggerService } from '@libs/logger/logger.service';

export class UploadFilesCreatedPostCommand {
  constructor(
    public readonly postId: string,
    public readonly files: Array<{ buffer: Buffer; originalname: string }>,
  ) {}
}

@CommandHandler(UploadFilesCreatedPostCommand)
export class UploadFilesCreatedPostCommandHandler implements ICommandHandler<
  UploadFilesCreatedPostCommand,
  void
> {
  constructor(
    private readonly s3FilesHttpAdapter: S3FilesHttpAdapter,
    private readonly fileRepository: FileRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute({
    postId,
    files,
  }: UploadFilesCreatedPostCommand): Promise<void> {
    let uploadedFiles: Array<{
      key: string;
      url: string;
      mimetype: string;
      size: number;
    }>;

    try {
      uploadedFiles = await this.s3FilesHttpAdapter.uploadFiles(
        'posts',
        postId,
        files,
      );
    } catch (error) {
      throw error;
    }

    const fileDtos = uploadedFiles.map((file) => ({
      key: file.key,
      url: file.url,
      mimetype: file.mimetype,
      size: file.size,
      postId,
    }));

    try {
      await this.fileRepository.createFiles(fileDtos);
    } catch (error) {
      await this.cleanupS3Files(uploadedFiles);
      throw error;
    }
  }

  private async cleanupS3Files(
    files: Array<{ key: string; url: string; mimetype: string; size: number }>,
  ): Promise<void> {
    try {
      for (const file of files) {
        await this.s3FilesHttpAdapter.deleteFile(file.key);
      }
    } catch (error) {
      this.logger.error(
        `Critical error failed to cleanup S3 files after DB error: ${error.message}. Keys: ${files.map((f) => f.key).join(', ')}`,
        error?.stack,
        UploadFilesCreatedPostCommandHandler.name,
      );
    }
  }
}
