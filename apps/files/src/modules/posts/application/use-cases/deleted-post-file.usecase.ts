import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FilesService } from '../../../../core/services/s3.service';
import { FileRepository } from '../../domain/infrastructure/file.repository';

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
