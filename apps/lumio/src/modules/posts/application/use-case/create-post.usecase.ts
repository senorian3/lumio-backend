import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PostView } from '../../api/dto/output/create-post.output';
import { PostEntity } from '../../domain/entities/post.entity';

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
  PostView
> {
  constructor(
    private userRepository: UserRepository,
    private postRepository: PostRepository,
    private configService: ConfigService,
  ) {}

  async execute(command: CreatePostCommand): Promise<PostView> {
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
      const response = await axios.post(
        'http://localhost:3001/api/v1/files/upload-post-files',
        { postId: newPost.id, files: command.files },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-API-Key': internalApiKey,
          },
        },
      );

      console.log('SUCESS IN AXIOS POSTS', response.data);

      return PostView.fromEntity(newPost, response.data);
    } catch (error) {
      console.log('ERROR IN AXIOS POSTS', error);
      throw error;
    }
  }
}
