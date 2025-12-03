import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { throttlerModule } from '../../../../../libs/core/guards/throttler/throttler.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth/presentation/controllers/auth.controller';
import { CreateUserUseCase } from './users/application/use-cases/create-user.use-case';
import { RegisterUserUseCase } from './auth/application/use-cases/register-user.usecase';
import { NodemailerService } from './adapters/nodemeiler/nodemeiler.service';
import { CryptoService } from './adapters/crypto.service';
import { UserRepository } from './users/infrastructure/repositories/user.repository';
import { EmailService } from './adapters/nodemeiler/template/email-examples';
import { JwtStrategy } from '../../../../../libs/core/guards/bearer/jwt.strategy';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { UserAccountsConfig } from './config/user-accounts.config';
import { LoginUserUseCase } from './auth/application/use-cases/login-user.usecase';
import { AuthService } from './auth/application/service/auth.service';
import { AuthRepository } from './auth/infrastructure/repositories/auth.repository';

const commandHandlers = [
  CreateUserUseCase,
  RegisterUserUseCase,
  LoginUserUseCase,
];

@Module({
  imports: [PrismaModule, throttlerModule],
  controllers: [AuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    UserAccountsConfig,
    NodemailerService,
    ...commandHandlers,
    CryptoService,
    EmailService,
    UserRepository,
    AuthService,
    AuthRepository,
    JwtStrategy,
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (userAccountConfig: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: userAccountConfig.accessTokenSecret,
          signOptions: {
            expiresIn: userAccountConfig.accessTokenExpireIn as ms.StringValue,
          },
        });
      },
      inject: [UserAccountsConfig],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (userAccountConfig: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: userAccountConfig.refreshTokenSecret,
          signOptions: {
            expiresIn: userAccountConfig.refreshTokenExpireIn as ms.StringValue,
          },
        });
      },
      inject: [UserAccountsConfig],
    },
  ],
})
export class UserAccountsModule {}
