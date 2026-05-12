import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MainPageView } from '@lumio/modules/posts/api/dto/output/main-page.output.dto';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { GetMainPageInputDto } from '@lumio/modules/posts/api/dto/input/get-main-page.input.dto';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { ExternalQueryUserAccountsRepository } from './../../../user-accounts/users/domain/infrastructure/user.external-query.repository';

export class GetMainPageQuery {
  constructor(
    public readonly currentUserId: number | null,
    public readonly paginationParams: GetMainPageInputDto,
  ) {}
}

@QueryHandler(GetMainPageQuery)
export class GetMainPageQueryHandler implements IQueryHandler<
  GetMainPageQuery,
  MainPageView
> {
  constructor(
    private readonly postQueryRepository: QueryPostRepository,
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
  ) {}

  async execute(query: GetMainPageQuery): Promise<MainPageView> {
    const { posts, totalCount } =
      await this.postQueryRepository.getPostsWithPagination(
        query.paginationParams.calculateSkip(),
        query.paginationParams.pageSize,
        query.currentUserId ?? undefined,
      );

    const allRegisteredUsersCount: number =
      await this.externalQueryUserAccountsRepository.getAllRegisteredUsersCount();

    const paginatedPosts = PaginatedViewDto.mapToView({
      items: posts,
      page: query.paginationParams.pageNumber,
      size: query.paginationParams.pageSize,
      totalCount,
    });

    return new MainPageView(paginatedPosts, allRegisteredUsersCount);
  }
}
