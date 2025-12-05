import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './users/application/use-cases/create-user.use-case';
import { RegisterUserUseCase } from './auth/application/use-cases/register-user.usecase';
import { NodemailerService } from './adapters/nodemailer/nodemailer.service';
import { CryptoService } from './adapters/crypto.service';
import { EmailService } from './adapters/nodemailer/template/email-examples';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { UserAccountsConfig } from './config/user-accounts.config';
import { LoginUserUseCase } from './auth/application/use-cases/login-user.usecase';
import { AuthService } from './auth/application/auth.service';
import { AuthRepository } from './sessions/infrastructure/session.repository';
import { PasswordRecoveryUseCase } from './auth/application/use-cases/password-recovery.usecase';
import { NewPasswordUseCase } from './auth/application/use-cases/new-password.usecase';
import { GithubStrategy } from '../../core/guards/oauth2-github/oauth2-github.guard';
import { PassportModule } from '@nestjs/passport';
import { LoginUserGitHubUseCase } from './auth/application/use-cases/login-user-github.usecase';
import { JwtStrategy } from '@lumio/core/guards/bearer/jwt.strategy';
import { RecaptchaService } from './adapters/recaptcha.service';
import { AuthController } from './auth/api/auth.controller';
import { UserRepository } from './users/infrastructure/user.repository';

const commandHandlers = [
  CreateUserUseCase,
  RegisterUserUseCase,
  LoginUserUseCase,
  PasswordRecoveryUseCase,
  NewPasswordUseCase,
  LoginUserGitHubUseCase,
];

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [
    UserAccountsConfig,
    NodemailerService,
    ...commandHandlers,
    CryptoService,
    EmailService,
    RecaptchaService,
    UserRepository,
    AuthService,
    AuthRepository,
    JwtStrategy,
    GithubStrategy,
    JwtService,
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
