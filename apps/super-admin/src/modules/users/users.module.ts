import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersResolver } from '@super-admin/modules/users/api/users.resolver';

@Module({
  imports: [PrismaModule],
  providers: [UsersResolver],
  exports: [],
})
export class UsersModule {}
