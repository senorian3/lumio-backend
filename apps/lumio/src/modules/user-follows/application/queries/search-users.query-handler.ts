import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserFollowQueryRepository } from '../../domain/infrastructure/user-follow.query-repository';
import { SearchUsersInputDto } from '../../api/dto/input/search-users.input-dto';
import { PaginatedUserSearchViewDto } from '../../api/dto/output/user-search.paginated.view-dto';

export class SearchUsersQuery {
  constructor(
    public readonly currentUserId: number,
    public readonly query: SearchUsersInputDto,
  ) {}
}

@QueryHandler(SearchUsersQuery)
export class SearchUsersQueryHandler implements IQueryHandler<
  SearchUsersQuery,
  PaginatedUserSearchViewDto
> {
  constructor(private readonly queryRepository: UserFollowQueryRepository) {}

  async execute(query: SearchUsersQuery): Promise<PaginatedUserSearchViewDto> {
    return await this.queryRepository.searchUsers(
      query.currentUserId,
      query.query,
    );
  }
}
