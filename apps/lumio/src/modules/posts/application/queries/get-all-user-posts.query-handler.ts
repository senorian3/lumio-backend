import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPostsQueryParams } from '../../api/dto/input/get-all-user-posts.query.dto';
import { PostEntity } from '../../domain/entities/post.entity';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { QueryPostRepository } from '../../domain/infrastructure/post.query.repository';
import { PostView } from '../../api/dto/output/create-post.output.dto';

export class GetAllUserPostsQuery {
  constructor(
    public readonly userId: number,
    public readonly query: GetPostsQueryParams,
  ) {}
}

@QueryHandler(GetAllUserPostsQuery)
export class GetAllUserPostsQueryHandler implements IQueryHandler<
  GetAllUserPostsQuery,
  PaginatedViewDto<PostView[]>
> {
  constructor(private readonly postQueryRepository: QueryPostRepository) {}

  async execute(
    command: GetAllUserPostsQuery,
  ): Promise<PaginatedViewDto<PostView[]>> {
    const paginatedPosts: PaginatedViewDto<PostEntity[]> =
      await this.postQueryRepository.findUserPosts(
        command.userId,
        command.query,
      );

    const result: PaginatedViewDto<PostView[]> = {
      page: paginatedPosts.page,
      pageSize: paginatedPosts.pageSize,
      pagesCount: paginatedPosts.pagesCount,
      totalCount: paginatedPosts.totalCount,
      items: paginatedPosts.items,
    };

    return result;
  }
}
