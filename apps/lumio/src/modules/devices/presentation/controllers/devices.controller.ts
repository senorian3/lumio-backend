import {
  UseGuards,
  Controller,
  Delete,
  HttpCode,
  Req,
  Param,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RefreshTokenGuard } from 'apps/lumio/src/core/guards/refresh/refresh-token.guard';
import { DeleteDeviceCommand } from '../../application/use-cases/delete-device.usecase';

@UseGuards(RefreshTokenGuard)
@Controller('security/devices')
export class DevicesController {
  constructor(private readonly commandBus: CommandBus) {}

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
}
