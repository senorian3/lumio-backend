import {
  UseGuards,
  Controller,
  Delete,
  HttpCode,
  Param,
  Get,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserId } from '@lumio/core/decorators/user-id.decorator';
import { DeviceId } from '@lumio/core/decorators/device-id.decorator';
import { RefreshTokenGuard } from '@lumio/core/guards/refresh/refresh-token.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { OutputSessionDto } from './dto/output/session.output.dto';
import { ApiGetAllSessions } from '@lumio/core/decorators/swagger/sessions/get-all-sessions.decorator';
import { ApiDeleteSessionByDeviceId } from '@lumio/core/decorators/swagger/sessions/delete-session-by-deviceId.decorator';
import { ApiDeleteAllSessionsExceptCurrent } from '@lumio/core/decorators/swagger/sessions/delete-all-sessions.decorator';
import { GetAllSessionsQuery } from '../application/queries/get-all-sessions.query-handler';
import { DeleteSessionCommand } from '../application/commands/delete-session.command-handler';
import { DeleteAllSessionsCommand } from '../application/commands/delete-all-sessions.command-handler';
import { SECURITY_BASE } from '@lumio/core/routes/security-routes';

@UseGuards(ThrottlerGuard, RefreshTokenGuard)
@Controller(SECURITY_BASE)
export class SessionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiGetAllSessions()
  @HttpCode(HttpStatus.OK)
  async getAllSessions(@UserId() userId: number): Promise<OutputSessionDto[]> {
    return await this.queryBus.execute<GetAllSessionsQuery, OutputSessionDto[]>(
      new GetAllSessionsQuery(userId),
    );
  }

  @Delete(':deviceId')
  @ApiDeleteSessionByDeviceId()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(
    @UserId() userId: number,
    @DeviceId() userDeviceId: string,
    @Param('deviceId') paramDeviceId: string,
  ): Promise<void> {
    return await this.commandBus.execute<DeleteSessionCommand, void>(
      new DeleteSessionCommand({
        userId,
        userDeviceId,
        paramDeviceId,
      }),
    );
  }

  @Delete()
  @ApiDeleteAllSessionsExceptCurrent()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllSessions(
    @UserId() userId: number,
    @DeviceId() deviceId: string,
  ): Promise<void> {
    return await this.commandBus.execute<DeleteAllSessionsCommand, void>(
      new DeleteAllSessionsCommand({
        userId,
        deviceId,
      }),
    );
  }
}
