import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { PostEntity } from '../../domain/entities/post.entity';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { AppLoggerService } from '@libs/logger/logger.service';
import { HttpService } from '@libs/shared/http.service';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';
import { ExternalQueryUserRepository } from './../../../user-accounts/users/domain/infrastructure/user.external-query.repository';

export class CreatePostCommand {
  constructor(
    public readonly userId: number,
    public readonly description: string,
    public readonly files: Array<Express.Multer.File>,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostCommandHandler implements ICommandHandler<
  CreatePostCommand,
  { file: OutputFileType[]; postId: number }
> {
  constructor(
    private readonly externalQueryUserRepository: ExternalQueryUserRepository,
    private readonly postRepository: PostRepository,
    private readonly httpService: HttpService,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    command: CreatePostCommand,
  ): Promise<{ file: OutputFileType[]; postId: number }> {
    const user = await this.externalQueryUserRepository.findById(
      command.userId,
    );

    console.log('Найденный юзер: ', user);

    if (!user) {
      console.log('Юзер не нашелся: ', command.userId);
      throw BadRequestDomainException.create('User does not exist', 'userId');
    }

    console.log('Начинаю создание поста');

    const newPost: PostEntity = await this.postRepository.createPost(
      command.userId,
      command.description,
    );

    console.log('Пост создался: ', newPost);

    try {
      console.log('Try catch блок, начало, fetch на files-backend');
      const mappedFile = await this.httpService.uploadFiles<OutputFileType[]>(
        `${GLOBAL_PREFIX}/files/upload-post-files`,
        newPost.id,
        command.files,
      );

      console.log('Fetch прошел, mappedFile: ', mappedFile);

      console.log('Начинаю создание поста в БД lumio');
      await this.postRepository.createPostFiles(newPost.id, mappedFile);
      console.log('Пост создался в БД lumio');
      return { file: mappedFile, postId: newPost.id };
    } catch (error) {
      this.logger.error(
        `Failed to upload files for postId=${newPost.id}: ${error.message}`,
        error?.stack,
        CommandHandler.name,
      );

      console.log('Ошибка при загрузке файлов на Lumio: ', error);

      try {
        console.log('Начинаю удаление поста в БД lumio в блоке catch');
        await this.postRepository.deletePostFilesByPostId(newPost.id);
        await this.postRepository.deletePost(newPost.id);
        console.log('Пост удален в БД lumio');
      } catch (cleanupError) {
        console.log(
          'Ошибка при удалении поста в БД lumio, сработал catch: ',
          cleanupError,
        );
        this.logger.error(
          `Cleanup failed for postId=${newPost.id}: ${cleanupError.message}`,
          cleanupError?.stack,
          CommandHandler.name,
        );
      }

      console.log('Конец блока catch, общая ошибка: ', error);

      throw BadRequestDomainException.create('Failed to upload files', 'files');
    }
  }
}
