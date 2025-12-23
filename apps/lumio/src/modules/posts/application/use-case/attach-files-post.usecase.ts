import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { PostView } from '../../api/dto/output/create-post.output';

export class AttachFilesPostCommand {
  constructor(
    public readonly postId: number,
    public readonly userId: number,
    public readonly files: OutputFileType[],
  ) {}
}

@CommandHandler(AttachFilesPostCommand)
export class CreateEmptyPostUseCase implements ICommandHandler<
  AttachFilesPostCommand,
  PostView
> {
  constructor(
    private userRepository: UserRepository,
    private postRepository: PostRepository,
  ) {}

  async execute(command: AttachFilesPostCommand): Promise<PostView> {
    const user = await this.userRepository.findUserById(command.userId);

    if (!user) {
      throw BadRequestDomainException.create('User does not exist', 'user');
    }

    const post = await this.postRepository.findById(command.postId);

    if (!post) {
      throw BadRequestDomainException.create('Post does not exist', 'post');
    }

    return PostView.fromEntity(post, command.files);
  }
}
