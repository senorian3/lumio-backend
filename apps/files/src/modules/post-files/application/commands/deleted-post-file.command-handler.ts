import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { S3FilesHttpAdapter } from '../../../../core/services/s3-files-http.adapter';
import { FileRepository } from '../../domain/infrastructure/file.repository';

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
  ) {}

  async execute({ postId }: DeletedPostFileCommand) {
    const postFiles = await this.fileRepository.findFilesByPostId(postId);

    for (const file of postFiles) {
      await this.s3FilesHttpAdapter.deleteFile(file.key);
    }

    await this.fileRepository.softDeleteFilesByPostId(postId);
  }
}
