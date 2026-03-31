import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedUserResponse } from '@super-admin/modules/users/domain/schema/user/paginated-user.entity';
import { UserQueryRepository } from '@super-admin/modules/users/domain/infrastructure/user.query-repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { UserSortBy } from '@super-admin/core/schema/user-sort-by.enum';
import { UserBlockedFilter } from '@super-admin/core/schema/user-blocked-filter.enum';
import { UserMapper } from '../mappers/user.mapper';
import {
  FindManyOptionsInputDto,
  SortOrder,
} from '@super-admin/modules/users/api/dto/input/find-many-options.input.dto';

export class GetUsersQuery {
  constructor(
    public readonly pageNumber: number = 1,
    public readonly pageSize: number = 10,
    public readonly search?: string,
    public readonly sortBy: UserSortBy = UserSortBy.CREATED_AT_DESC,
    public readonly blockedFilter?: UserBlockedFilter,
  ) {}
}

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  private readonly userMapper = new UserMapper();

  constructor(
    private readonly userQueryRepository: UserQueryRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(query: GetUsersQuery): Promise<PaginatedUserResponse> {
    try {
      const skip = (query.pageNumber - 1) * query.pageSize;

      let orderBy: SortOrder = SortOrder.DESC;
      if (query.sortBy) {
        if (
          query.sortBy === UserSortBy.USERNAME_ASC ||
          query.sortBy === UserSortBy.CREATED_AT_ASC
        ) {
          orderBy = SortOrder.ASC;
        } else {
          orderBy = SortOrder.DESC;
        }
      }

      const findManyOptions: FindManyOptionsInputDto = {
        skip,
        take: query.pageSize,
        orderBy,
        search: query.search,
        sortBy: query.sortBy,
        blockedFilter: query.blockedFilter,
      };

      const [users, totalCount] = await Promise.all([
        this.userQueryRepository.findMany(findManyOptions),
        this.userQueryRepository.count(findManyOptions),
      ]);

      const pagesCount =
        totalCount > 0 ? Math.ceil(totalCount / query.pageSize) : 0;

      return {
        page: query.pageNumber,
        pageSize: query.pageSize,
        pagesCount: pagesCount,
        totalCount: totalCount,
        items: this.userMapper.mapFromDtoArray(users),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get users: pageNumber=${query.pageNumber}, pageSize=${query.pageSize}, sortBy=${query.sortBy}`,
        error?.stack,
        GetUsersHandler.name,
      );

      return {
        page: query.pageNumber,
        pageSize: query.pageSize,
        pagesCount: 0,
        totalCount: 0,
        items: [],
      };
    }
  }
}
