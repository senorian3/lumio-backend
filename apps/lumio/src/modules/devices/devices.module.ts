import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DeleteDeviceUseCase } from './application/use-cases/delete-device.usecase';
import { AuthController } from '../user-accounts/auth/presentation/controllers/auth.controller';
import { UserAccountsConfig } from '../user-accounts/config/user-accounts.config';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { AuthRepository } from '../user-accounts/auth/infrastructure/repositories/auth.repository';
import { DeleteAllDevicesUseCase } from './application/use-cases/delete-all-devices.usecase';
import { GetAllDevicesUseCase } from './application/use-cases/get-all-devices.usecase';
import { QueryDevicesRepository } from './infrastructure/devices.query.repository';

const commandHandlers = [
  DeleteDeviceUseCase,
  DeleteDeviceUseCase,
  DeleteAllDevicesUseCase,
  GetAllDevicesUseCase,
];

@Module({
  imports: [JwtModule, UserAccountsModule],

  controllers: [AuthController],
  providers: [
    UserAccountsConfig,
    ...commandHandlers,
    AuthRepository,
    QueryDevicesRepository,
  ],
})
export class DevicesModule {}
