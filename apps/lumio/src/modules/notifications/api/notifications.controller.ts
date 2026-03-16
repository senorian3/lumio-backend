import { Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetUserNotificationsParams } from '@lumio/modules/notifications/api/dto/input/get-user-notifications.query';
import { UserId } from '@lumio/core/decorators/user-id.decorator';
import { GetUserNotificationsQuery } from '@lumio/modules/notifications/application/queries/get-user-notifications.query-handler';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { NotificationViewDto } from '@lumio/modules/notifications/api/dto/output/notification.output.dto';
import {
  NOTIFICATION_BASE,
  NOTIFICATION_ROUTES,
} from '@lumio/core/routes/notification-routes';
import { ApiGetNotificationHistory } from '@lumio/core/decorators/swagger/notifications/get-notification-history.decorator';
import { MarkAllReadCommand } from '@lumio/modules/notifications/application/commands/mark-all-as-read.command.handler';
import { ApiMarkAllNotificationsAsRead } from '@lumio/core/decorators/swagger/notifications/mark-all-as-read.decorator';

@UseGuards(JwtAuthGuard)
@Controller(NOTIFICATION_BASE)
export class NotificationsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get(NOTIFICATION_ROUTES.HISTORY)
  @ApiGetNotificationHistory()
  async getHistory(
    @Query()
    query: GetUserNotificationsParams,
    @UserId() userId: number,
  ): Promise<PaginatedViewDto<NotificationViewDto[]>> {
    return await this.queryBus.execute<
      GetUserNotificationsQuery,
      PaginatedViewDto<NotificationViewDto[]>
    >(new GetUserNotificationsQuery(userId, query));
  }

  @Put(NOTIFICATION_ROUTES.MARK_ALL_READ)
  @ApiMarkAllNotificationsAsRead()
  async markAllAsRead(@UserId() userId: number): Promise<void> {
    await this.commandBus.execute<MarkAllReadCommand, void>(
      new MarkAllReadCommand(userId),
    );
  }
}
