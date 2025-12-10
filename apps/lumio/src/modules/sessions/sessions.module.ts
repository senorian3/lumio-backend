import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QuerySessionsRepository } from './domain/infrastructure/session.query.repository';
import { DeleteAllSessionssUseCase } from './application/use-cases/delete-all-sessions.usecase';
import { GetAllSessionsUseCase } from './application/use-cases/get-all-sessions.usecase';
import { DeleteSessionUseCase } from './application/use-cases/delete-session.usecase';
import { SessionRepository } from './domain/infrastructure/session.repository';
import { SessionsController } from './api/sessions.controller';
import { UserAccountsConfig } from '../user-accounts/config/user-accounts.config';

const useCases = [
  DeleteAllSessionssUseCase,
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
