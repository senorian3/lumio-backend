import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { S3FilesHttpAdapter } from '../../../../core/adapters/s3-files-http.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

export class DeleteFileByKeyCommand {
  constructor(public readonly key: string) {}
}

@CommandHandler(DeleteFileByKeyCommand)
export class DeleteFileByKeyCommandHandler implements ICommandHandler<
  DeleteFileByKeyCommand,
  void
> {
  constructor(
    private readonly s3FilesHttpAdapter: S3FilesHttpAdapter,
    private readonly logger: AppLoggerService,
  ) {}

  async execute({ key }: DeleteFileByKeyCommand): Promise<void> {
    try {
      await this.s3FilesHttpAdapter.deleteFile(key);
    } catch (error) {
      this.logger.error(
        `Failed to delete file with key=${key}: ${error.message}`,
        error?.stack,
        DeleteFileByKeyCommandHandler.name,
      );
      throw BadRequestDomainException.create('Failed to delete file', 'file');
    }
  }
}
