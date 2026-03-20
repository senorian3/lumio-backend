import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { User } from '@super-admin/modules/users/domain/schema/user.schema';
import { PaginatedUserResponse } from '@super-admin/modules/users/domain/schema/paginated-user.entity';
import { SortDirection } from '@super-admin/core/schema/sort-direction.enum';
import { GetUserQuery } from '@super-admin/modules/users/application/queries/get-user.query-handler';
import { GetUsersQuery } from '@super-admin/modules/users/application/queries/get-users.query-handler';
import { UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from '@super-admin/core/guard/basic-auth.guard';

@Resolver(() => User)
@UseGuards(BasicAuthGuard)
export class UsersResolver {
  constructor(private readonly queryBus: QueryBus) {}

  @Query(() => User, { nullable: true, name: 'user' })
  async getUser(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<User | null> {
    return this.queryBus.execute(new GetUserQuery(id));
  }

  @Query(() => PaginatedUserResponse, { name: 'users' })
  async getUsers(
    @Args('pageNumber', { type: () => Int, nullable: true, defaultValue: 1 })
    pageNumber: number = 1,
    @Args('pageSize', { type: () => Int, nullable: true, defaultValue: 10 })
    pageSize: number = 10,
    @Args('sortDirection', {
      type: () => SortDirection,
      nullable: true,
      defaultValue: 'ASC',
    })
    sortDirection: SortDirection = SortDirection.ASC,
  ): Promise<PaginatedUserResponse> {
    return this.queryBus.execute(
      new GetUsersQuery(pageNumber, pageSize, sortDirection),
    );
  }
}
