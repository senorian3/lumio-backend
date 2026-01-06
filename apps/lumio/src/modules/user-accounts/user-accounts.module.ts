import { Module } from '@nestjs/common';
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
import { AuthService } from './auth/application/auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@lumio/core/guards/bearer/jwt.strategy';
import { RecaptchaService } from './adapters/recaptcha.service';
import { AuthController } from './auth/api/auth.controller';
import { SessionsModule } from '../sessions/sessions.module';
import { UserRepository } from './users/domain/infrastructure/user.repository';
import { ScheduleModule } from '@nestjs/schedule';
import { UserSchedulerService } from './scheduler/users-scheduler';
import { YandexStrategy } from '@lumio/core/guards/oauth2-yandex/oauth2-yandex.guard';
import { LoggerModule } from '@libs/logger/logger.module';
import { AboutUserQueryHandler } from '@lumio/modules/user-accounts/auth/application/queries/about-user.query-handler';
import { UserQueryRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.query.repository';
import { LoginUserYandexCommandHandler } from './auth/application/commands/login-user-yandex.command-handler';
import { LoginUserCommandHandler } from './auth/application/commands/login-user.command-handler';
import { LogoutUserCommandHandler } from './auth/application/commands/logout-user.command-handler';
import { NewPasswordCommandHandler } from './auth/application/commands/new-password.command-handler';
import { PasswordRecoveryCommandHandler } from './auth/application/commands/password-recovery.command-handler';
import { RefreshTokenCommandHandler } from './auth/application/commands/refresh-token.command-handler';
import { RegisterUserCommandHandler } from './auth/application/commands/register-user.command-handler';
import { RegistrationConfirmationUserCommandHandler } from './auth/application/commands/registration-confirmation.command-handler';
import { CreateUserCommandHandler } from './users/application/commands/create-user.command-handler';

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
  CreateUserCommandHandler,
  RegisterUserCommandHandler,
  LoginUserCommandHandler,
  PasswordRecoveryCommandHandler,
  NewPasswordCommandHandler,
  LogoutUserCommandHandler,
  RegistrationConfirmationUserCommandHandler,
  LoginUserYandexCommandHandler,
  RefreshTokenCommandHandler,
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
  exports: [UserRepository, UserAccountsConfig],
})
export class UserAccountsModule {}
