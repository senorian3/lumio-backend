import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QuerySessionsRepository } from './domain/infrastructure/session.query.repository';
import { SessionRepository } from './domain/infrastructure/session.repository';
import { SessionsController } from './api/sessions.controller';
import { UserAccountsConfig } from '../user-accounts/config/user-accounts.config';
import { DeleteAllSessionsUseCase } from './application/use-cases/command/delete-all-sessions.usecase';
import { DeleteSessionUseCase } from './application/use-cases/command/delete-session.usecase';
import { GetAllSessionsUseCase } from './application/use-cases/query/get-all-sessions.usecase';

const useCases = [
  DeleteAllSessionsUseCase,
  GetAllSessionsUseCase,
  DeleteSessionUseCase,
];

const repositories = [SessionRepository, QuerySessionsRepository];

@Module({
  imports: [JwtModule],
  controllers: [SessionsController],
  providers: [UserAccountsConfig, ...useCases, ...repositories],
  exports: [SessionRepository],
})
export class SessionsModule {}
