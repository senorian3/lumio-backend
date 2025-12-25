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
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@lumio/core/guards/bearer/jwt.strategy';
import { RecaptchaService } from './adapters/recaptcha.service';
import { AuthController } from './auth/api/auth.controller';
import { SessionsModule } from '../sessions/sessions.module';
import { UserRepository } from './users/domain/infrastructure/user.repository';
import { LogoutUserUseCase } from '@lumio/modules/user-accounts/auth/application/use-cases/logout-user.usecase';
import { RegistrationConfirmationUserUseCase } from '@lumio/modules/user-accounts/auth/application/use-cases/registration-confirmation.usecase';
import { ScheduleModule } from '@nestjs/schedule';
import { UserSchedulerService } from './scheduler/users-scheduler';
import { YandexStrategy } from '@lumio/core/guards/oauth2-yandex/oauth2-yandex.guard';
import { LoginUserYandexUseCase } from '@lumio/modules/user-accounts/auth/application/use-cases/login-user-yandex.usecase';
import { LoggerModule } from '@libs/logger/logger.module';
import { RefreshTokenUseCase } from '@lumio/modules/user-accounts/auth/application/use-cases/refresh-token.usecase';
import { AboutUserQueryHandler } from '@lumio/modules/user-accounts/auth/application/query/about-user.query-handler';
import { UserQueryRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.query.repository';

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
  LogoutUserUseCase,
  RegistrationConfirmationUserUseCase,
  LoginUserYandexUseCase,
  RefreshTokenUseCase,
];

const services = [
  NodemailerService,
  CryptoService,
  EmailService,
  RecaptchaService,
  AuthService,
];

const strategies = [JwtStrategy, YandexStrategy];

@Module({
  imports: [
    PassportModule,
    SessionsModule,
    JwtModule,
    ScheduleModule.forRoot(),
    LoggerModule,
  ],
  controllers: [AuthController],
  providers: [
    UserAccountsConfig,
    UserRepository,
    UserSchedulerService,
    AboutUserQueryHandler,
    UserQueryRepository,
    ...useCases,
    ...services,
    ...strategies,
    ...jwtProviders,
  ],
})
export class UserAccountsModule {}
