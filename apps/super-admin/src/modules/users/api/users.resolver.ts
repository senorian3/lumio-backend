import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { User } from '@super-admin/modules/users/domain/schema/user.schema';
import { PaginatedUserResponse } from '@super-admin/modules/users/domain/schema/paginated-user.entity';
import { PaginationInput } from '@super-admin/core/schema/pagination.input';
import { UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from '@super-admin/core/guard/basic-auth.guard';

@Resolver(() => User)
@UseGuards(BasicAuthGuard)
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
    @Args() pagination: PaginationInput,
  ): Promise<PaginatedUserResponse> {
    // Теперь здесь должны быть данные
    console.log('Pagination:', JSON.stringify(pagination, null, 2));

    const pageNumber = pagination?.pageNumber ?? 1;
    const pageSize = pagination?.pageSize ?? 10;

    // ... логика получения данных

    return {
      page: pageNumber,
      pageSize: pageSize,
      pagesCount: 0, // заглушка
      totalCount: 0, // заглушка
      items: [], // заглушка
    };
  }
}
