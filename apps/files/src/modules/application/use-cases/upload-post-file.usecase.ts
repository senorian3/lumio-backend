import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FileRepository } from '@files/modules/domain/infrastructure/file.repository';
import { FilesService } from '../s3.service';
import { PostFileEntity } from '@files/modules/domain/entities/post-file.entity';
import { QueryFileRepository } from '@files/modules/domain/infrastructure/file.query.repository';

export class UploadFilesCreatedPostCommand {
  constructor(
    public readonly postId: number,
    public readonly files: Array<{ buffer: Buffer; originalname: string }>,
  ) {}
}

@CommandHandler(UploadFilesCreatedPostCommand)
export class UploadFilesCreatedPostUseCase implements ICommandHandler<
  UploadFilesCreatedPostCommand,
  PostFileEntity[]
> {
  constructor(
    private filesService: FilesService,
    private fileRepository: FileRepository,
    private queryFilesRepository: QueryFileRepository,
  ) {}

  async execute({
    postId,
    files,
  }: UploadFilesCreatedPostCommand): Promise<PostFileEntity[]> {
    const uploadedFiles: PostFileEntity[] = await this.filesService.uploadFiles(
      postId,
      files,
    );

    for (const file of uploadedFiles) {
      await this.fileRepository.createFile({
        key: file.key,
        url: file.url,
        mimetype: file.mimetype,
        size: file.size,
        postId,
      });
    }

    return await this.queryFilesRepository.getAllFilesByPostId(postId);
  }
}
