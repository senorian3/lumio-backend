import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersResolver } from '@super-admin/modules/users/api/users.resolver';
import { UserService } from '@super-admin/modules/users/application/user.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersResolver, UserService],
  exports: [UserService],
})
export class UsersModule {}
