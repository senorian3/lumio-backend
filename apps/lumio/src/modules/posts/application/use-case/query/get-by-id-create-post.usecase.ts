import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { PostView } from '../../../api/dto/output/create-post.output.dto';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

export class GetCreatePostUserCommand {
  constructor(
    public readonly postId: number,
    public readonly files: OutputFileType[],
  ) {}
}

@QueryHandler(GetCreatePostUserCommand)
export class GetCreatePostUseCase implements IQueryHandler<
  GetCreatePostUserCommand,
  PostView
> {
  constructor(private readonly queryPostRepository: QueryPostRepository) {}

  async execute(command: GetCreatePostUserCommand): Promise<PostView> {
    const post = await this.queryPostRepository.findById(command.postId);

    if (!post) {
      throw BadRequestDomainException.create('Post does not exist', 'post');
    }

    const view = PostView.fromEntity(post, command.files);

    return view;
  }
}
