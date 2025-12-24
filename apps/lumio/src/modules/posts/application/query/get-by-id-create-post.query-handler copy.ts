import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { PostView } from '@lumio/modules/posts/api/dto/output/create-post.output';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';

export class GetCreatePostUserQuery {
  constructor(
    public readonly postId: number,
    public readonly files: OutputFileType[],
  ) {}
}

@QueryHandler(GetCreatePostUserQuery)
export class GetCreatePostQueryHandler implements IQueryHandler<
  GetCreatePostUserQuery,
  PostView
> {
  constructor(private readonly queryPostRepository: QueryPostRepository) {}

  async execute(command: GetCreatePostUserQuery): Promise<PostView> {
    const post = await this.queryPostRepository.findById(command.postId);

    const view = PostView.fromEntity(post, command.files);

    return view;
  }
}
