import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { User } from '@super-admin/modules/users/domain/schema/user.schema';
import { PaginatedUserResponse } from '@super-admin/modules/users/domain/schema/paginated-user.entity';
import { SortDirection } from '@super-admin/core/schema/sort-direction.enum';
import { GetUserQuery } from '@super-admin/modules/users/application/queries/get-user.query-handler';
import { GetUsersQuery } from '@super-admin/modules/users/application/queries/get-users.query-handler';
import { UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from '@super-admin/core/guard/basic-auth.guard';
import { DeletedUserCommand } from '@super-admin/modules/users/application/commands/deleted-user.command-handler';
import { BanUserCommand } from '@super-admin/modules/users/application/commands/ban-user.command-handler';

@Resolver(() => User)
@UseGuards(BasicAuthGuard)
export class UsersResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

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
    @Args('search', { type: () => String, nullable: true })
    search?: string,
  ): Promise<PaginatedUserResponse> {
    return this.queryBus.execute(
      new GetUsersQuery(pageNumber, pageSize, sortDirection, search),
    );
  }

  @Mutation(() => Boolean, { name: 'deleteUser' })
  async deleteUser(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    await this.commandBus.execute(new DeletedUserCommand(id));
    return true;
  }

  @Mutation(() => Boolean, { name: 'banUser' })
  async banUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('banReason', { type: () => String }) banReason: string,
  ): Promise<boolean> {
    await this.commandBus.execute(new BanUserCommand(id, banReason));
    return true;
  }

  @Mutation(() => Boolean, { name: 'unbanUser' })
  async unBanUser(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    console.log(id);
    return true;
  }
}
