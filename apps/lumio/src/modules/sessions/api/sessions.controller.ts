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
import { RefreshTokenGuard } from '@lumio/core/guards/refresh/refresh-token.guard';
import { OutputSessionType } from './dto/output/output';
import { GetAllSessionsCommand } from '../application/use-cases/get-all-sessions.usecase';
import { DeleteSessionCommand } from '../application/use-cases/delete-session.usecase';
import { DeleteAllSessionsCommand } from '../application/use-cases/delete-all-sessions.usecase';

@UseGuards(RefreshTokenGuard)
@Controller('security/devices')
export class SessionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getAllSessions(@Req() req: any): Promise<OutputSessionType[]> {
    return await this.queryBus.execute<
      GetAllSessionsCommand,
      OutputSessionType[]
    >(new GetAllSessionsCommand(req.user.userId));
  }

  @Delete(':deviceId')
  @HttpCode(204)
  async deleteSession(
    @Req() req: any,
    @Param('deviceId') paramDeviceId: string,
  ): Promise<void> {
    return await this.commandBus.execute<DeleteSessionCommand, void>(
      new DeleteSessionCommand({
        userId: req.user.userId,
        userDeviceId: req.user.deviceId,
        paramDeviceId,
      }),
    );
  }

  @Delete()
  @HttpCode(204)
  async deleteAllSessions(@Req() req: any): Promise<void> {
    return await this.commandBus.execute<DeleteAllSessionsCommand, void>(
      new DeleteAllSessionsCommand({
        userId: req.user.userId,
        deviceId: req.user.deviceId,
      }),
    );
  }
}
