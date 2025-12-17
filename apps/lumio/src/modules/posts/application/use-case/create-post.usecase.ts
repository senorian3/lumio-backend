import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePostDto } from '@lumio/modules/posts/api/dto/input/create-post.input.dto';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';

export class CreatePostCommand {
  constructor(
    public readonly userId: number,
    public readonly files: Array<Express.Multer.File>,
    public readonly body: CreatePostDto,
  ) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<
  CreatePostCommand,
  number
> {
  constructor(
    private userRepository: UserRepository,
    private postRepository: PostRepository,
  ) {}

  async execute(command: CreatePostCommand): Promise<number> {
    const user = await this.userRepository.findUserById(command.userId);
    if (!user) {
      throw BadRequestDomainException.create('User does not exist', 'user');
    }

    const newPostId = await this.postRepository.createPost({
      userId: command.userId,
      description: command.body.description,
    });

    //тут запрос на файлы в rabbitMQ

    return newPostId;
  }
}
