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
import { OutputSessionDto } from './dto/output/session.output.dto';
import { SECURITY_BASE } from '@lumio/core/routs/routs';
import { ApiGetAllSessions } from '@lumio/core/decorators/swagger/sessions/get-all-sessions.decorator';
import { ApiDeleteSessionByDeviceId } from '@lumio/core/decorators/swagger/sessions/delete-session-by-deviceId.decorator';
import { ApiDeleteAllSessionsExceptCurrent } from '@lumio/core/decorators/swagger/sessions/delete-all-sessions.decorator';
import { GetAllSessionsCommand } from '../application/use-cases/query/get-all-sessions.usecase';
import { DeleteSessionCommand } from '../application/use-cases/command/delete-session.usecase';
import { DeleteAllSessionsCommand } from '../application/use-cases/command/delete-all-sessions.usecase';

@UseGuards(RefreshTokenGuard)
@Controller(SECURITY_BASE)
export class SessionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiGetAllSessions()
  async getAllSessions(@Req() req: any): Promise<OutputSessionDto[]> {
    return await this.queryBus.execute<
      GetAllSessionsCommand,
      OutputSessionDto[]
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
