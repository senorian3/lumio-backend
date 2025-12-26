import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import { PostEntity } from '../../domain/entities/post.entity';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';

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
    private userRepository: UserRepository,
    private postRepository: PostRepository,
    private configService: ConfigService,
  ) {}

  async execute(
    command: CreatePostCommand,
  ): Promise<{ file: OutputFileType[]; postId: number }> {
    const user = await this.userRepository.findUserById(command.userId);

    if (!user) {
      throw BadRequestDomainException.create('User does not exist', 'user');
    }

    const newPost: PostEntity = await this.postRepository.createPost(
      command.userId,
      command.description,
    );

    const internalApiKey = this.configService.get('INTERNAL_API_KEY');

    try {
      const formData = new FormData();
      formData.append('postId', newPost.id.toString());

      command.files.forEach((file) => {
        formData.append('files', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      });

      const filesFrontendUrl = this.configService.get('FILES_FRONTEND_URL');

      const mappedFile = await axios.post(
        `${filesFrontendUrl}/api/v1/files/upload-post-files`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'X-Internal-API-Key': internalApiKey,
          },
        },
      );

      return { file: mappedFile.data, postId: newPost.id };
    } catch (error) {
      throw error;
    }
  }
}
