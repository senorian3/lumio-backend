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
import { JwtModule, JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { UserAccountsConfig } from './config/user-accounts.config';
import { LoginUserUseCase } from './auth/application/use-cases/login-user.usecase';
import { AuthService } from './auth/application/auth.service';
import { PasswordRecoveryUseCase } from './auth/application/use-cases/password-recovery.usecase';
import { NewPasswordUseCase } from './auth/application/use-cases/new-password.usecase';
import { GithubStrategy } from '../../core/guards/oauth2-github/oauth2-github.guard';
import { PassportModule } from '@nestjs/passport';
import { LoginUserGitHubUseCase } from './auth/application/use-cases/login-user-github.usecase';
import { JwtStrategy } from '@lumio/core/guards/bearer/jwt.strategy';
import { RecaptchaService } from './adapters/recaptcha.service';
import { AuthController } from './auth/api/auth.controller';
import { UserRepository } from './users/infrastructure/user.repository';
import { SessionsModule } from './sessions/sessions.module';

const createJwtServiceProvider = (
  provide: string | symbol,
  secretKey: keyof UserAccountsConfig,
  expiresInKey: keyof UserAccountsConfig,
) => ({
  provide,
  useFactory: (config: UserAccountsConfig): JwtService => {
    return new JwtService({
      secret: config[secretKey] as string,
      signOptions: {
        expiresIn: config[expiresInKey] as ms.StringValue,
      },
    });
  },
  inject: [UserAccountsConfig],
});

const jwtProviders = [
  createJwtServiceProvider(
    ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
    'accessTokenSecret',
    'accessTokenExpireIn',
  ),
  createJwtServiceProvider(
    REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
    'refreshTokenSecret',
    'refreshTokenExpireIn',
  ),
];

const useCases = [
  CreateUserUseCase,
  RegisterUserUseCase,
  LoginUserUseCase,
  PasswordRecoveryUseCase,
  NewPasswordUseCase,
  LoginUserGitHubUseCase,
];

const services = [
  NodemailerService,
  CryptoService,
  EmailService,
  RecaptchaService,
  AuthService,
];

const strategies = [GithubStrategy, JwtStrategy];

@Module({
  imports: [PassportModule, SessionsModule, JwtModule],
  controllers: [AuthController],
  providers: [
    UserAccountsConfig,
    UserRepository,
    ...useCases,
    ...services,
    ...strategies,
    ...jwtProviders,
  ],
})
export class UserAccountsModule {}
