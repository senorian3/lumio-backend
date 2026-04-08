import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserFollowQueryRepository } from '../../domain/infrastructure/user-follow.query-repository';
import { PaginatedFollowersViewDto } from '../../api/dto/output/followers.paginated.view-dto';
import { GetFollowersInputDto } from '../../api/dto/input/get-followers.input-dto';

export class GetFollowersQuery {
  constructor(
    public readonly currentUserId: number,
    public readonly targetUserId: number,
    public readonly query: GetFollowersInputDto,
  ) {}
}

@QueryHandler(GetFollowersQuery)
export class GetFollowersQueryHandler implements IQueryHandler<
  GetFollowersQuery,
  PaginatedFollowersViewDto
> {
  constructor(private readonly queryRepository: UserFollowQueryRepository) {}

  async execute(query: GetFollowersQuery): Promise<PaginatedFollowersViewDto> {
    return await this.queryRepository.getFollowers(
      query.targetUserId,
      query.query.pageNumber,
      query.query.pageSize,
    );
  }
}
