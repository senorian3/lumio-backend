import { Module } from '@nestjs/common';
import { ExternalQueryUserRepository } from './users/domain/infrastructure/user.external-query.repository';

@Module({
  providers: [ExternalQueryUserRepository],
  exports: [ExternalQueryUserRepository],
})
export class UserQueryModule {}
