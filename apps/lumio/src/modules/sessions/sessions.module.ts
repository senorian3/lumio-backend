import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QuerySessionsRepository } from './domain/infrastructure/session.query.repository';
import { SessionRepository } from './domain/infrastructure/session.repository';
import { SessionsController } from './api/sessions.controller';
import { UserAccountsConfig } from '../user-accounts/config/user-accounts.config';
import { DeleteAllSessionsCommandHandler } from './application/commands/delete-all-sessions.command-handler';
import { DeleteSessionCommandHandler } from './application/commands/delete-session.command-handler';
import { GetAllSessionsQueryHandler } from './application/queries/get-all-sessions.query-handler';

const useCases = [
  DeleteAllSessionsCommandHandler,
  GetAllSessionsQueryHandler,
  DeleteSessionCommandHandler,
];

const repositories = [SessionRepository, QuerySessionsRepository];

@Module({
  imports: [JwtModule],
  controllers: [SessionsController],
  providers: [UserAccountsConfig, ...useCases, ...repositories],
  exports: [SessionRepository],
})
export class SessionsModule {}
