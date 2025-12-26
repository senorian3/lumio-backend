import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FileRepository } from '@files/modules/domain/infrastructure/file.repository';
import { FilesService } from '../s3.service';

export class DeletedPostFileCommand {
  constructor(public readonly postId: number) {}
}

@CommandHandler(DeletedPostFileCommand)
export class DeletedPostFilePostUseCase implements ICommandHandler<
  DeletedPostFileCommand,
  void
> {
  constructor(
    private readonly filesService: FilesService,
    private readonly fileRepository: FileRepository,
  ) {}

  async execute({ postId }: DeletedPostFileCommand) {
    const postFiles = await this.fileRepository.findFilesByPostId(postId);

    for (const file of postFiles) {
      await this.filesService.deleteFile(file.key);
    }

    await this.fileRepository.softDeleteFilesByPostId(postId);
  }
}
