import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { User } from '@super-admin/modules/users/domain/schema/user.schema';
import { PaginatedUserResponse } from '@super-admin/modules/users/domain/schema/paginated-user.entity';
import { SortDirection } from '@super-admin/core/schema/sort-direction.enum';
import { UserService } from '@super-admin/modules/users/application/user.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User, { nullable: true, name: 'user' })
  async getUser(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<User | null> {
    return this.userService.getUser(id);
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
    return this.userService.getUsers(pageNumber, pageSize, sortDirection);
  }
}
