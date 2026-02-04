import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FilesService } from '../../../../core/services/s3.service';
import { PostFileEntity } from '../../domain/entities/post-file.entity';
import { FileRepository } from '../../domain/infrastructure/file.repository';

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
    private readonly filesService: FilesService,
    private readonly fileRepository: FileRepository,
  ) {}

  async execute({
    postId,
    files,
  }: UploadFilesCreatedPostCommand): Promise<void> {
    console.log('Файлы перед загрузкой в S3: ', files);
    const uploadedFiles: PostFileEntity[] = await this.filesService.uploadFiles(
      'posts',
      postId,
      files,
    );

    console.log('Файлы после загрузкой в S3: ', uploadedFiles);

    for (const file of uploadedFiles) {
      console.log('Начинаю создание файла в БД files');
      await this.fileRepository.createFile({
        key: file.key,
        url: file.url,
        mimetype: file.mimetype,
        size: file.size,
        postId,
      });
    }
  }
}
