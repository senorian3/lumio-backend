import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { S3FilesHttpAdapter } from '../../../../core/adapters/s3-files-http.adapter';
import { FileRepository } from '../../domain/infrastructure/file.repository';
import { AppLoggerService } from '@libs/logger/logger.service';

export class DeletedPostFileCommand {
  constructor(public readonly postId: number) {}
}

@CommandHandler(DeletedPostFileCommand)
export class DeletedPostFileCommandHandler implements ICommandHandler<
  DeletedPostFileCommand,
  void
> {
  constructor(
    private readonly s3FilesHttpAdapter: S3FilesHttpAdapter,
    private readonly fileRepository: FileRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute({ postId }: DeletedPostFileCommand) {
    const postFiles = await this.fileRepository.findFilesByPostId(postId);

    if (postFiles.length === 0) {
      return;
    }

    let s3Deleted = false;

    try {
      for (const file of postFiles) {
        await this.s3FilesHttpAdapter.deleteFile(file.key);
      }

      s3Deleted = true;
    } catch (error) {
      this.logger.error(
        `Failed to delete files in S3 for postId=${postId}: ${error.message}`,
        error?.stack,
        DeletedPostFileCommandHandler.name,
      );
      throw error;
    }

    if (s3Deleted) {
      try {
        await this.fileRepository.softDeleteFilesByPostId(postId);
      } catch (error) {
        this.logger.error(
          `CRITICAL: Files deleted from S3 but DB failed for postId=${postId}. Manual intervention required.`,
          error?.stack,
          DeletedPostFileCommandHandler.name,
        );
        throw error;
      }
    }
  }
}
