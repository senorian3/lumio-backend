import { OutputFilesDto } from '@libs/rabbitmq/dto/output';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostQueryRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { PostView } from '@lumio/modules/posts/api/dto/output/createPost.output';

export class GetCreatePostUserQuery {
  constructor(
    public readonly postId: number,
    public readonly files: OutputFilesDto[],
  ) {}
}

@QueryHandler(GetCreatePostUserQuery)
export class GetCreatePostQueryHandler implements IQueryHandler<
  GetCreatePostUserQuery,
  PostView
> {
  constructor(private readonly postQueryRepository: PostQueryRepository) {}

  async execute(command: GetCreatePostUserQuery): Promise<PostView> {
    const post = await this.postQueryRepository.findById(command.postId);

    const view = PostView.fromEntity(post, command.files);

    return view;
  }
}
