import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserAccountsConfig } from '../config/user-accounts.config';
import { UserAccountsModule } from '../user-accounts.module';
import { AuthRepository } from './infrastructure/session.repository';
import { AuthController } from '../auth/api/auth.controller';
import { QuerySessionsRepository } from './infrastructure/session.query.repository';
import { DeleteAllSessionssUseCase } from './application/use-cases/delete-all-sessions.usecase';
import { GetAllSessionsUseCase } from './application/use-cases/get-all-sessions.usecase';
import { DeleteSessionUseCase } from './application/use-cases/delete-session.usecase';

const commandHandlers = [
  DeleteAllSessionssUseCase,
  GetAllSessionsUseCase,
  DeleteSessionUseCase,
];

@Module({
  imports: [JwtModule, UserAccountsModule],

  controllers: [AuthController],
  providers: [
    UserAccountsConfig,
    ...commandHandlers,
    AuthRepository,
    QuerySessionsRepository,
  ],
})
export class SessionsModule {}
