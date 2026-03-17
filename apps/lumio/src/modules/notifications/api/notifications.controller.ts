import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetUserNotificationsParams } from '@lumio/modules/notifications/api/dto/input/get-user-notifications.query';
import { UserId } from '@lumio/core/decorators/user-id.decorator';
import { GetUserNotificationsQuery } from '@lumio/modules/notifications/application/queries/get-user-notifications.query-handler';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import {
  NotificationViewDto,
  UnreadCountViewDto,
} from '@lumio/modules/notifications/api/dto/output/notification.output.dto';
import {
  NOTIFICATION_BASE,
  NOTIFICATION_ROUTES,
} from '@lumio/core/routes/notification-routes';
import { ApiGetNotificationHistory } from '@lumio/core/decorators/swagger/notifications/get-notification-history.decorator';
import { GetUnreadCountQuery } from '@lumio/modules/notifications/application/queries/get-unread-count.query-handler';
import { ApiGetUnreadCount } from '@lumio/core/decorators/swagger/notifications/get-unread-count.decorator';
import { DeleteNotificationCommand } from '@lumio/modules/notifications/application/commands/delete-notification.command.handler';
import { ApiDeleteNotification } from '@lumio/core/decorators/swagger/notifications/delete-notification.decorator';
import { WebSocketDocs } from '@lumio/core/decorators/swagger/notifications/websocket-docs.decorator';
import { MarkNotificationsAsReadCommand } from '@lumio/modules/notifications/application/commands/mark-notifications-as-read.command.handler';
import { MarkNotificationsAsReadInputDto } from '@lumio/modules/notifications/api/dto/input/mark-notifications-as-read.input.dto';
import { ApiMarkNotificationsAsRead } from '@lumio/core/decorators/swagger/notifications/mark-notifications-as-read.decorator';

@UseGuards(JwtAuthGuard)
@Controller(NOTIFICATION_BASE)
export class NotificationsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get(NOTIFICATION_ROUTES.WEBSOCKET_DOCS)
  @WebSocketDocs()
  getWebSocketDocs(): {
    message: string;
    websocket: { namespace: string; url: string };
    events: {
      'notification:new': { title: string; message: string };
      error: { message: string };
    };
  } {
    return {
      message: 'See Swagger description for WebSocket documentation',
      websocket: {
        namespace: '/notifications',
        url: 'wss://lumio.su/notifications',
      },
      events: {
        'notification:new': {
          title: 'Подписка активирована',
          message: 'Ваша подписка активирована и действует до 14.04.2026',
        },
        error: {
          message: 'Unauthorized: Missing token',
        },
      },
    };
  }

  @Get(NOTIFICATION_ROUTES.HISTORY)
  @ApiGetNotificationHistory()
  async getHistory(
    @Query() query: GetUserNotificationsParams,
    @UserId() userId: number,
  ): Promise<PaginatedViewDto<NotificationViewDto[]>> {
    return await this.queryBus.execute<
      GetUserNotificationsQuery,
      PaginatedViewDto<NotificationViewDto[]>
    >(new GetUserNotificationsQuery(userId, query));
  }

  @Get(NOTIFICATION_ROUTES.UNREAD_COUNT)
  @ApiGetUnreadCount()
  async getUnreadCount(@UserId() userId: number): Promise<UnreadCountViewDto> {
    return await this.queryBus.execute<GetUnreadCountQuery, UnreadCountViewDto>(
      new GetUnreadCountQuery(userId),
    );
  }

  @Put(NOTIFICATION_ROUTES.MARK_READ)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiMarkNotificationsAsRead()
  async markNotificationsAsRead(
    @Body() dto: MarkNotificationsAsReadInputDto,
    @UserId() userId: number,
  ): Promise<void> {
    await this.commandBus.execute<MarkNotificationsAsReadCommand, void>(
      new MarkNotificationsAsReadCommand(userId, dto.notificationIds),
    );
  }

  @Delete(NOTIFICATION_ROUTES.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteNotification()
  async deleteNotification(
    @Param('id') id: string,
    @UserId() userId: number,
  ): Promise<void> {
    await this.commandBus.execute<DeleteNotificationCommand, void>(
      new DeleteNotificationCommand(id, userId),
    );
  }
}
