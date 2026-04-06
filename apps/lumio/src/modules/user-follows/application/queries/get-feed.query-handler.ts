import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserFollowQueryRepository } from '../../domain/infrastructure/user-follow.query-repository';
import { GetFeedInputDto } from '../../api/dto/input/get-feed.input-dto';
import { ExternalQueryPostsRepository } from '@lumio/modules/posts/domain/infrastructure/post.external-query.repository';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';

export class GetFeedQuery {
  constructor(
    public readonly currentUserId: number,
    public readonly query: GetFeedInputDto,
  ) {}
}

@QueryHandler(GetFeedQuery)
export class GetFeedQueryHandler implements IQueryHandler<
  GetFeedQuery,
  PaginatedViewDto<PostView[]>
> {
  constructor(
    private readonly userFollowQueryRepository: UserFollowQueryRepository,
    private readonly externalQueryPostsRepository: ExternalQueryPostsRepository,
  ) {}

  async execute(query: GetFeedQuery): Promise<PaginatedViewDto<PostView[]>> {
    const { currentUserId, query: feedQuery } = query;
    const { pageNumber, pageSize } = feedQuery;
    const skip = feedQuery.calculateSkip();

    const followingIds =
      await this.userFollowQueryRepository.getFollowingIds(currentUserId);

    if (followingIds.length === 0) {
      return PaginatedViewDto.mapToView({
        items: [],
        page: pageNumber,
        size: pageSize,
        totalCount: 0,
      });
    }

    const { posts, totalCount } =
      await this.externalQueryPostsRepository.getPostsByUserIds(
        followingIds,
        skip,
        pageSize,
      );

    const postViews = posts.map((post) => PostView.fromPrisma(post));

    return PaginatedViewDto.mapToView({
      items: postViews,
      page: pageNumber,
      size: pageSize,
      totalCount,
    });
  }
}
