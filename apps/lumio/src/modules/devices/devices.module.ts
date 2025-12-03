import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { DeleteDeviceUseCase } from './application/use-cases/delete-device.usecase';
import { AuthController } from '../user-accounts/auth/presentation/controllers/auth.controller';
import { UserAccountsConfig } from '../user-accounts/config/user-accounts.config';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { AuthRepository } from '../user-accounts/auth/infrastructure/repositories/auth.repository';

const commandHandlers = [DeleteDeviceUseCase, DeleteDeviceUseCase];

@Module({
  imports: [PrismaModule, JwtModule, UserAccountsModule],
  controllers: [AuthController],
  providers: [UserAccountsConfig, ...commandHandlers, AuthRepository],
})
export class DevicesModule {}
