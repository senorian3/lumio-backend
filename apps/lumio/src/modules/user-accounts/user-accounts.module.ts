import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { throttlerModule } from '../../../../../libs/core/guards/throttler/throttler.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth/presentation/controllers/auth.controller';
import { UserAccountsConfig } from './config/user-accounts.config';
import { CreateUserUseCase } from './users/application/use-cases/create-user.use-case';
import { RegisterUserUseCase } from './auth/application/use-cases/register-user.usecase';
import { NodemailerService } from './adapters/nodemeiler/nodemeiler.service';
import { CryptoService } from './adapters/crypto.service';
import { UserRepository } from './users/infrastructure/repositories/user.repository';
import { EmailService } from './adapters/nodemeiler/template/email-examples';

const commandHandlers = [CreateUserUseCase, RegisterUserUseCase];

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
  ],
})
export class UserAccountsModule {}
