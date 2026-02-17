import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { S3FilesHttpAdapter } from '../../../../core/adapters/s3-files-http.adapter';

export class DeleteFileByKeyCommand {
  constructor(public readonly key: string) {}
}

@CommandHandler(DeleteFileByKeyCommand)
export class DeleteFileByKeyCommandHandler implements ICommandHandler<
  DeleteFileByKeyCommand,
  void
> {
  constructor(private readonly s3FilesHttpAdapter: S3FilesHttpAdapter) {}

  async execute({ key }: DeleteFileByKeyCommand): Promise<void> {
    try {
      await this.s3FilesHttpAdapter.deleteFile(key);
    } catch (error) {
      throw error;
    }
  }
}
