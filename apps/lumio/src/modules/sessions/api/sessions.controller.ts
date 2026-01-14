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
import { ApiGetAllSessions } from '@lumio/core/decorators/swagger/sessions/get-all-sessions.decorator';
import { ApiDeleteSessionByDeviceId } from '@lumio/core/decorators/swagger/sessions/delete-session-by-deviceId.decorator';
import { ApiDeleteAllSessionsExceptCurrent } from '@lumio/core/decorators/swagger/sessions/delete-all-sessions.decorator';
import { GetAllSessionsQuery } from '../application/queries/get-all-sessions.query-handler';
import { DeleteSessionCommand } from '../application/commands/delete-session.command-handler';
import { DeleteAllSessionsCommand } from '../application/commands/delete-all-sessions.command-handler';
import { SECURITY_BASE } from '@lumio/core/routes/security-routes';

@UseGuards(RefreshTokenGuard)
@Controller(SECURITY_BASE)
export class SessionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiGetAllSessions()
  @HttpCode(HttpStatus.OK)
  async getAllSessions(@Req() req: any): Promise<OutputSessionDto[]> {
    return await this.queryBus.execute<GetAllSessionsQuery, OutputSessionDto[]>(
      new GetAllSessionsQuery(req.user.userId),
    );
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
