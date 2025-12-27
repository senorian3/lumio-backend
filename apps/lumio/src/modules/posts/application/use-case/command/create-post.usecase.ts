import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { PostEntity } from '../../../domain/entities/post.entity';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { AppLoggerService } from '@libs/logger/logger.service';
import { HttpService } from '../../http.service';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';

export class CreatePostCommand {
  constructor(
    public readonly userId: number,
    public readonly description: string,
    public readonly files: Array<Express.Multer.File>,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<
  CreatePostCommand,
  { file: OutputFileType[]; postId: number }
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly postRepository: PostRepository,
    private readonly httpService: HttpService,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    command: CreatePostCommand,
  ): Promise<{ file: OutputFileType[]; postId: number }> {
    const user = await this.userRepository.findUserById(command.userId);

    if (!user) {
      throw BadRequestDomainException.create('User does not exist', 'userId');
    }

    const newPost: PostEntity = await this.postRepository.createPost(
      command.userId,
      command.description,
    );

    try {
      const mappedFile = await this.httpService.uploadFiles<OutputFileType[]>(
        `${GLOBAL_PREFIX}/files/upload-post-files`,
        newPost.id,
        command.files,
      );

      return { file: mappedFile, postId: newPost.id };
    } catch (error) {
      this.logger.error(
        `Failed to upload files for postId=${newPost.id}: ${error.message}`,
        error?.stack,
        CreatePostUseCase.name,
      );
      throw BadRequestDomainException.create('Failed to upload files', 'files');
    }
  }
}
