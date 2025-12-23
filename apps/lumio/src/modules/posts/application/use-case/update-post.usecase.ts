import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { UpdatePostDto } from '../../api/dto/transfer/update-post..dto';
import { PostView } from '../../api/dto/output/create-post.output';

export class UpdatePostCommand {
  constructor(
    public readonly postId: number,
    public readonly userId: number,
    public dto: UpdatePostDto,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<
  UpdatePostCommand,
  PostView
> {
  constructor(
    private userRepository: UserRepository,
    private postRepository: PostRepository,
  ) {}

  async execute(command: UpdatePostCommand): Promise<PostView> {
    const user = await this.userRepository.findUserById(command.userId);

    if (!user) {
      throw BadRequestDomainException.create('User does not exist', 'user');
    }

    const post = await this.postRepository.findById(command.postId);

    if (!post) {
      throw BadRequestDomainException.create('Post does not exist', 'post');
    }

    if (post.userId !== command.userId) {
      throw ForbiddenDomainException.create(
        'Post does not belong to the user',
        'post',
      );
    }

    const updatedPost = await this.postRepository.updateDescription(
      command.postId,
      command.dto.description,
    );

    return PostView.fromEntity(updatedPost, command.dto.files);
  }
}
