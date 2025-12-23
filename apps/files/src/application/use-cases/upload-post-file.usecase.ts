import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { FilesService } from '@files/application/s3.service';
import { FileRepository } from '@files/domain/infrastructure/file.repository';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

export class UploadFilesCreatedPostCommand {
  constructor(
    public readonly files: Array<{ buffer: Buffer; originalname: string }>,
    public readonly userId: number,
  ) {}
}

@CommandHandler(UploadFilesCreatedPostCommand)
export class UploadFilesCreatedPostUseCase implements ICommandHandler<
  UploadFilesCreatedPostCommand,
  void
> {
  constructor(
    private filesService: FilesService,
    private fileRepository: FileRepository,
    private configService: ConfigService,
  ) {}

  async execute({
    files,
    userId,
  }: UploadFilesCreatedPostCommand): Promise<void> {
    const internalApiKey = this.configService.get('INTERNAL_API_KEY');
    let postId: number;

    try {
      const response = await axios.post(
        'http://localhost:3000/api/v1/posts',
        { userId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-API-Key': internalApiKey,
          },
        },
      );

      console.log('SUCESS IN AXIOS FILES', response.data);

      postId = +response.data;
    } catch (error) {
      console.log('ERROR IN AXIOS FILES', error);
      throw error;
    }

    const uploadedFiles = await this.filesService.uploadFiles(postId, files);

    console.log(
      'uploadedFiles',
      uploadedFiles,
      'uploadedFiles[0]',
      uploadedFiles[0],
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

    return;
  }
}
