import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserFollowQueryRepository } from '../../domain/infrastructure/user-follow.query-repository';
import { PaginatedFollowingViewDto } from '../../api/dto/output/following.paginated.view-dto';
import { GetFollowingInputDto } from '../../api/dto/input/get-following.input-dto';

export class GetFollowingQuery {
  constructor(
    public readonly currentUserId: number,
    public readonly targetUserId: number,
    public readonly query: GetFollowingInputDto,
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
