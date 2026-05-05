import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserFollowQueryRepository } from '../../domain/infrastructure/user-follow.query-repository';
import { PaginatedFollowingViewDto } from '../../api/dto/output/following.paginated.view-dto';
import { PaginationParams } from '@libs/core/dto/pagination/base.query-params.input-dto';

export class GetFollowingQuery {
  constructor(
    public readonly targetUserId: number,
    public readonly query: PaginationParams,
  ) {}
}

@QueryHandler(GetFollowingQuery)
export class GetFollowingQueryHandler implements IQueryHandler<
  GetFollowingQuery,
  PaginatedFollowingViewDto
> {
  constructor(private readonly queryRepository: UserFollowQueryRepository) {}

  async execute(query: GetFollowingQuery): Promise<PaginatedFollowingViewDto> {
    return await this.queryRepository.getFollowing(
      query.targetUserId,
      query.query.pageNumber,
      query.query.pageSize,
    );
  }
}
