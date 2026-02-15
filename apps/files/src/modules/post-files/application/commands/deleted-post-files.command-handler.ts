import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { S3FilesHttpAdapter } from '../../../../core/adapters/s3-files-http.adapter';
import { FileRepository } from '../../domain/infrastructure/file.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

export class DeletedPostFilesCommand {
  constructor(public readonly postId: string) {}
}

@CommandHandler(DeletedPostFilesCommand)
export class DeletedPostFilesCommandHandler implements ICommandHandler<
  DeletedPostFilesCommand,
  void
> {
  constructor(
    private readonly s3FilesHttpAdapter: S3FilesHttpAdapter,
    private readonly fileRepository: FileRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute({ postId }: DeletedPostFilesCommand) {
    const postFiles = await this.fileRepository.findFilesByPostId(postId);

    if (postFiles.length === 0) {
      return;
    }

    try {
      await this.fileRepository.softDeleteFilesByPostId(postId);
    } catch (error) {
      this.logger.error(
        `Failed to soft delete files in DB for postId=${postId}: ${error.message}`,
        error?.stack,
        DeletedPostFilesCommand.name,
      );
      throw BadRequestDomainException.create('Failed to delete files', 'files');
    }

    try {
      for (const file of postFiles) {
        await this.s3FilesHttpAdapter.deleteFile(file.key);
      }
    } catch (error) {
      this.logger.error(
        `Critical error to delete files from S3 for postId=${postId}: ${error.message}, need to delete files: ${postFiles.map(
          (file) => file.key,
        )}`,
        error?.stack,
        DeletedPostFilesCommand.name,
      );
    }
  }
}
