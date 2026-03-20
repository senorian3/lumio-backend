import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { User } from '@super-admin/modules/users/domain/schema/user.schema';
import { PaginatedUserResponse } from '@super-admin/modules/users/domain/schema/paginated-user.entity';
import { PaginationInput } from '@super-admin/core/schema/pagination.input';

@Resolver(() => User)
export class UsersResolver {
  constructor() {}

  @Query(() => User, { nullable: true, name: 'user' })
  async getUser(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<User | null> {
    console.log(id);
    return null;
  }

  @Query(() => PaginatedUserResponse, { name: 'users' })
  async getUsers(
    @Args('pagination', { type: () => PaginationInput })
    pagination: PaginationInput,
  ): Promise<PaginatedUserResponse> {
    const items: User[] = [];
    const totalCount = 0;

    return {
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      pagesCount:
        totalCount > 0 ? Math.ceil(totalCount / pagination.pageSize) : 0,
      totalCount,
      items,
    };
  }
}
