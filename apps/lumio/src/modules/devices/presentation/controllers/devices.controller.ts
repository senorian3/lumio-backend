import {
  UseGuards,
  Controller,
  Delete,
  HttpCode,
  Req,
  Param,
  Get,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RefreshTokenGuard } from 'apps/lumio/src/core/guards/refresh/refresh-token.guard';
import { DeleteDeviceCommand } from '../../application/use-cases/delete-device.usecase';
import { DeleteAllDevicesCommand } from '../../application/use-cases/delete-all-devices.usecase';
import { OutputDeviceType } from '../../dto/output';
import { GetAllDevicesCommand } from '../../application/use-cases/get-all-devices.usecase';

@UseGuards(RefreshTokenGuard)
@Controller('security/devices')
export class DevicesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getAllDevices(@Req() req: any): Promise<OutputDeviceType[]> {
    return await this.queryBus.execute(
      new GetAllDevicesCommand(req.user.userId),
    );
  }

  @Delete(':deviceId')
  @HttpCode(204)
  async deleteDevice(
    @Req() req: any,
    @Param('deviceId') paramDeviceId: string,
  ): Promise<void> {
    return await this.commandBus.execute(
      new DeleteDeviceCommand(
        req.user.userId,
        req.user.deviceId,
        paramDeviceId,
      ),
    );
  }

  @Delete()
  @HttpCode(204)
  async deleteAllDevices(@Req() req: any): Promise<void> {
    return await this.commandBus.execute(
      new DeleteAllDevicesCommand(req.user.userId, req.user.deviceId),
    );
  }
}
