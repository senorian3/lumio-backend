import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { S3FilesHttpAdapter } from '../../../../core/adapters/s3-files-http.adapter';
import { PostFileEntity } from '../../domain/entities/post-file.entity';
import { FileRepository } from '../../domain/infrastructure/file.repository';
import { AppLoggerService } from '@libs/logger/logger.service';

export class UploadFilesCreatedPostCommand {
  constructor(
    public readonly postId: number,
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
    const tempFiles = files.map((file, index) => ({
      key: `temp_${postId}_${index}_${Date.now()}`,
      url: '',
      mimetype: file.originalname,
      size: 0,
      postId,
    }));

    let createdFiles: PostFileEntity[];
    try {
      createdFiles = await this.fileRepository.createFiles(tempFiles);
    } catch (error) {
      this.logger.error(
        `Failed to create files in DB for postId=${postId}: ${error.message}`,
        error?.stack,
        UploadFilesCreatedPostCommandHandler.name,
      );
      throw error;
    }

    let uploadedFiles: PostFileEntity[];
    try {
      uploadedFiles = await this.s3FilesHttpAdapter.uploadFiles(
        'posts',
        postId,
        files,
      );
    } catch (error) {
      try {
        await this.fileRepository.deleteFilesByIds(
          createdFiles.map((f) => f.id),
        );
      } catch (error) {
        this.logger.error(
          `Critical error to delete rollback files in DB for postId=${postId}: ${error.message}`,
          error?.stack,
          UploadFilesCreatedPostCommandHandler.name,
        );
      }
      this.logger.error(
        `Failed to upload files to S3, rolled back DB for postId=${postId}: ${error.message}`,
        error?.stack,
        UploadFilesCreatedPostCommandHandler.name,
      );
      throw error;
    }

    const updates = createdFiles.map((file, index) => ({
      id: file.id,
      key: uploadedFiles[index].key,
      url: uploadedFiles[index].url,
      mimetype: uploadedFiles[index].mimetype,
      size: uploadedFiles[index].size,
    }));

    try {
      await this.fileRepository.updateFiles(updates);
    } catch (error) {
      this.logger.error(
        `Critical error to update files in DB for postId=${postId}: ${error.message}`,
        error?.stack,
        UploadFilesCreatedPostCommandHandler.name,
      );
      throw error;
    }
  }
}
