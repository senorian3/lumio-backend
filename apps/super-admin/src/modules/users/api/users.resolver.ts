import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { User } from '@super-admin/modules/users/domain/schema/user.schema';
import { PaginatedUserResponse } from '@super-admin/modules/users/domain/schema/paginated-user.entity';
import { UserSortBy } from '@super-admin/core/schema/user-sort-by.enum';
import { GetUserQuery } from '@super-admin/modules/users/application/queries/get-user.query-handler';
import { GetUsersQuery } from '@super-admin/modules/users/application/queries/get-users.query-handler';
import { UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from '@super-admin/core/guard/basic-auth.guard';
import { DeletedUserCommand } from '@super-admin/modules/users/application/commands/deleted-user.command-handler';
import { BanUserCommand } from '@super-admin/modules/users/application/commands/ban-user.command-handler';
import { UnBanUserCommand } from '@super-admin/modules/users/application/commands/unban-user.command-handler';
import { PaginatedPaymentsOutput } from '../domain/schema/paginated-payments.output.dto';
import { PaginatedPaymentResponse } from '@super-admin/modules/users/domain/schema/paginated-payment.entity';
import { GetPaymentsQuery } from '../application/queries/get-payments.query-handler';
import { PaymentsHttpClient } from '@super-admin/core/integration/payments-http.client';
import { FilesHttpClient } from '@super-admin/core/integration/files-http.client';
import { PaymentDto } from '@super-admin/core/integration/dto/payment.dto';
import { FileDto } from '@super-admin/core/integration/dto/file.dto';
import { FileSortBy } from '@super-admin/core/integration/dto/file-sort-by.enum';
import { PaymentSortBy } from '@super-admin/core/integration/dto/payment-sort-by.enum';

@Resolver(() => User)
@UseGuards(BasicAuthGuard)
export class UsersResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly paymentsHttpClient: PaymentsHttpClient,
    private readonly filesHttpClient: FilesHttpClient,
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
    @Args('search', { type: () => String, nullable: true })
    search?: string,
    @Args('sortBy', {
      type: () => UserSortBy,
      nullable: true,
      defaultValue: UserSortBy.CREATED_AT_DESC,
    })
    sortBy: UserSortBy = UserSortBy.CREATED_AT_DESC,
  ): Promise<PaginatedUserResponse> {
    return this.queryBus.execute(
      new GetUsersQuery(pageNumber, pageSize, search, sortBy),
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
  async unbanUser(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    await this.commandBus.execute(new UnBanUserCommand(id));
    return true;
  }

  @Query(() => PaginatedPaymentsOutput)
  async getPayments(
    @Args('pageNumber', { type: () => Int, defaultValue: 1 })
    pageNumber: number,
    @Args('pageSize', { type: () => Int, defaultValue: 6 })
    pageSize: number,
    @Args('search', { type: () => String, nullable: true })
    search?: string,
    @Args('sortBy', {
      type: () => PaymentSortBy,
      defaultValue: PaymentSortBy.DATE_DESC,
    })
    sortBy: PaymentSortBy = PaymentSortBy.DATE_DESC,
  ): Promise<PaginatedPaymentsOutput> {
    const result: PaginatedPaymentResponse = await this.queryBus.execute(
      new GetPaymentsQuery(pageNumber, pageSize, search, sortBy),
    );

    return result;
  }

  @ResolveField(() => [PaymentDto], { name: 'payments' })
  async payments(
    @Parent() user: User,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('sortBy', {
      type: () => PaymentSortBy,
      defaultValue: PaymentSortBy.DATE_DESC,
    })
    sortBy: PaymentSortBy,
  ): Promise<PaymentDto[]> {
    if (!user.profile?.id) {
      return [];
    }

    return this.paymentsHttpClient.getUserPayments(
      user.profile.id,
      page,
      limit,
      sortBy,
    );
  }

  @ResolveField(() => [FileDto], { name: 'files' })
  async files(
    @Parent() user: User,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('sortBy', {
      type: () => FileSortBy,
      defaultValue: FileSortBy.DATE_DESC,
    })
    sortBy: FileSortBy,
  ): Promise<FileDto[]> {
    return this.filesHttpClient.getUserFiles(user.id, page, limit, sortBy);
  }
}
