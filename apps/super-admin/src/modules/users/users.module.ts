import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersResolver } from '@super-admin/modules/users/api/users.resolver';
import { UserRepository } from '@super-admin/modules/users/domain/infrastructure/user.repository';
import { UserQueryRepository } from '@super-admin/modules/users/domain/infrastructure/user.query-repository';
import { GetUserHandler } from '@super-admin/modules/users/application/queries/get-user.query-handler';
import { GetUsersHandler } from '@super-admin/modules/users/application/queries/get-users.query-handler';

const repositories = [UserRepository, UserQueryRepository];
const queryHandlers = [GetUserHandler, GetUsersHandler];

@Module({
  imports: [PrismaModule, CqrsModule],
  providers: [UsersResolver, ...repositories, ...queryHandlers],
  exports: [...repositories],
})
export class UsersModule {}
