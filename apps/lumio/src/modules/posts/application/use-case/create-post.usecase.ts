import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreatePostDto } from '@lumio/modules/posts/api/dto/input/create-post.input.dto';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { RabbitMQService } from './../../../../../../../libs/rabbitmq/rabbitmq.service';
import { OutputFilesDto } from '@libs/rabbitmq/dto/output';

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
  { files: OutputFilesDto[]; postId: number }
> {
  constructor(
    private userRepository: UserRepository,
    private postRepository: PostRepository,
    private rabbitMQService: RabbitMQService,
  ) {}

  async execute(
    command: CreatePostCommand,
  ): Promise<{ files: OutputFilesDto[]; postId: number }> {
    const user = await this.userRepository.findUserById(command.userId);
    if (!user) {
      throw BadRequestDomainException.create('User does not exist', 'user');
    }

    const newPostId = await this.postRepository.createPost({
      userId: command.userId,
      description: command.body.description,
    });

    const uploadedFiles = await this.rabbitMQService.sendPostCreatedRpc(
      newPostId,
      command.files,
    );

    return { files: uploadedFiles, postId: newPostId };
  }
}
