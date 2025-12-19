import { OutputFilesDto } from '@libs/rabbitmq/dto/output';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostQueryRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { PostView } from '@lumio/modules/posts/api/dto/output/createPost.output';
import { RabbitMQService } from '@libs/rabbitmq/rabbitmq.service';

export class GetAllUserPostsQuery {
  constructor(public readonly userId: number) {}
}

@QueryHandler(GetAllUserPostsQuery)
export class GetAllUserPostsQueryHandler implements IQueryHandler<
  GetAllUserPostsQuery,
  PostView[]
> {
  constructor(
    private readonly postQueryRepository: PostQueryRepository,
    private rabbitMQService: RabbitMQService,
  ) {}

  async execute(command: GetAllUserPostsQuery): Promise<PostView[]> {
    const posts = await this.postQueryRepository.findUserPosts(command.userId);

    const postIds = posts.map((post) => post.id);

    const userPostsFiles = await this.rabbitMQService.getUsersPostsRpc(postIds);

    const view = posts.map((post) => PostView.fromEntity(post, userPostsFiles));

    return view;
  }
}
