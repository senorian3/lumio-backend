import {
  UseGuards,
  Controller,
  Delete,
  HttpCode,
  Req,
  Param,
  Get,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RefreshTokenGuard } from '@lumio/core/guards/refresh/refresh-token.guard';
import { OutputSessionType } from './dto/output/output';
import { GetAllSessionsCommand } from '../application/use-cases/get-all-sessions.usecase';
import { DeleteSessionCommand } from '../application/use-cases/delete-session.usecase';
import { DeleteAllSessionsCommand } from '../application/use-cases/delete-all-sessions.usecase';
import { SECURITY_BASE } from '@lumio/core/routs/routs';
import { ApiGetAllSessions } from '@lumio/core/decorators/swagger/get-all-sessions.decorator';
import { ApiDeleteSessionByDeviceId } from '@lumio/core/decorators/swagger/delete-session-by-deviceId.decorator';
import { ApiDeleteAllSessionsExceptCurrent } from '@lumio/core/decorators/swagger/delete-all-sessions.decorator';

@UseGuards(RefreshTokenGuard)
@Controller(SECURITY_BASE)
export class SessionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiGetAllSessions()
  async getAllSessions(@Req() req: any): Promise<OutputSessionType[]> {
    return await this.queryBus.execute<
      GetAllSessionsCommand,
      OutputSessionType[]
    >(new GetAllSessionsCommand(req.user.userId));
  }

  @Delete(':deviceId')
  @ApiDeleteSessionByDeviceId()
  @HttpCode(HttpStatus.NO_CONTENT)
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
  @ApiDeleteAllSessionsExceptCurrent()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllSessions(@Req() req: any): Promise<void> {
    return await this.commandBus.execute<DeleteAllSessionsCommand, void>(
      new DeleteAllSessionsCommand({
        userId: req.user.userId,
        deviceId: req.user.deviceId,
      }),
    );
  }
}
