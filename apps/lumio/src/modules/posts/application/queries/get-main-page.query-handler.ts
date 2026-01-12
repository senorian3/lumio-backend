import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MainPageView } from '@lumio/modules/posts/api/dto/output/main-page.output.dto';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { GetMainPageInputDto } from '@lumio/modules/posts/api/dto/input/get-main-page.input.dto';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { ExternalQueryUserRepository } from './../../../user-accounts/users/domain/infrastructure/user.external-query.repository';

export class GetMainPageQuery {
  constructor(public readonly paginationParams: GetMainPageInputDto) {}
}

@QueryHandler(GetMainPageQuery)
export class GetMainPageQueryHandler implements IQueryHandler<
  GetMainPageQuery,
  MainPageView
> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly externalQueryUserRepository: ExternalQueryUserRepository,
  ) {}

  async execute(query: GetMainPageQuery): Promise<MainPageView> {
    const { posts, totalCount } =
      await this.postRepository.getPostsWithPagination(
        query.paginationParams.calculateSkip(),
        query.paginationParams.pageSize,
      );

    const allRegisteredUsersCount: number =
      await this.externalQueryUserRepository.getAllRegisteredUsersCount();

    const postViews = posts.map(PostView.fromPrisma);
    const paginatedPosts = PaginatedViewDto.mapToView({
      items: postViews,
      page: query.paginationParams.pageNumber,
      size: query.paginationParams.pageSize,
      totalCount,
    });

    return new MainPageView(paginatedPosts, allRegisteredUsersCount);
  }
}
