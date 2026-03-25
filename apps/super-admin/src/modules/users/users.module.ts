import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersResolver } from '@super-admin/modules/users/api/users.resolver';
import { UserRepository } from '@super-admin/modules/users/domain/infrastructure/user.repository';
import { UserQueryRepository } from '@super-admin/modules/users/domain/infrastructure/user.query-repository';
import { GetUserHandler } from '@super-admin/modules/users/application/queries/get-user.query-handler';
import { GetUsersHandler } from '@super-admin/modules/users/application/queries/get-users.query-handler';
import { DeletedUserCommandHandler } from '@super-admin/modules/users/application/commands/deleted-user.command-handler';
import { BanUserCommandHandler } from '@super-admin/modules/users/application/commands/ban-user.command-handler';
import { UnBanUserCommandHandler } from '@super-admin/modules/users/application/commands/unban-user.command-handler';
import { HttpModule } from '@nestjs/axios';
import { GetPaymentsHandler } from '@super-admin/modules/users/application/queries/get-payments.query-handler';
import { PaymentsHttpClient } from '@super-admin/core/integration/payments-http.client';

const repositories = [UserRepository, UserQueryRepository];
const queryHandlers = [GetUserHandler, GetUsersHandler, GetPaymentsHandler];
const commandHandlers = [
  DeletedUserCommandHandler,
  BanUserCommandHandler,
  UnBanUserCommandHandler,
];

@Module({
  imports: [PrismaModule, CqrsModule, HttpModule],
  providers: [
    PaymentsHttpClient,
    UsersResolver,
    ...repositories,
    ...queryHandlers,
    ...commandHandlers,
  ],
  exports: [...repositories],
})
export class UsersModule {}
