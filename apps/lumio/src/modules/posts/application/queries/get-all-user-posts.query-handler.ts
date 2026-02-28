import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPostsQueryParams } from '../../api/dto/input/get-all-user-posts.query.dto';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { QueryPostRepository } from '../../domain/infrastructure/post.query.repository';
import { PostView } from '../../api/dto/output/post.output.dto';
import { PaginatedPostViewDto } from '@lumio/modules/posts/api/dto/output/posts.paginated.view-dto';

export class GetAllUserPostsQuery {
  constructor(
    public readonly userId: number | null,
    public readonly query: GetPostsQueryParams,
    public readonly userIdParam: number,
  ) {}
}

@QueryHandler(GetAllUserPostsQuery)
export class GetAllUserPostsQueryHandler implements IQueryHandler<
  GetAllUserPostsQuery,
  PaginatedPostViewDto
> {
  constructor(private readonly postQueryRepository: QueryPostRepository) {}

  async execute(command: GetAllUserPostsQuery): Promise<PaginatedPostViewDto> {
    let role = 'viewer';

    if (command.userId === command.userIdParam) {
      role = 'author';
    }

    const paginatedPosts: PaginatedViewDto<PostView[]> =
      await this.postQueryRepository.findUserPosts(
        command.userIdParam,
        command.query,
      );

    const result: PaginatedPostViewDto = {
      page: paginatedPosts.page,
      pageSize: paginatedPosts.pageSize,
      pagesCount: paginatedPosts.pagesCount,
      totalCount: paginatedPosts.totalCount,
      items: paginatedPosts.items.map(PostView.fromPrisma),
      role,
    };

    return result;
  }
}
