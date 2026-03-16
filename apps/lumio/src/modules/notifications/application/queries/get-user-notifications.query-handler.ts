import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserNotificationsParams } from '@lumio/modules/notifications/api/dto/input/get-user-notifications.query';
import { NotificationQueryRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.query-repository';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { NotificationViewDto } from '@lumio/modules/notifications/api/dto/output/notification.output.dto';

export class GetUserNotificationsQuery {
  constructor(
    public readonly userId: number,
    public readonly params: GetUserNotificationsParams,
  ) {}
}

@QueryHandler(GetUserNotificationsQuery)
export class GetUserNotificationsQueryHandler implements IQueryHandler<
  GetUserNotificationsQuery,
  PaginatedViewDto<NotificationViewDto[]>
> {
  constructor(
    private readonly notificationQueryRepository: NotificationQueryRepository,
  ) {}

  async execute(
    query: GetUserNotificationsQuery,
  ): Promise<PaginatedViewDto<NotificationViewDto[]>> {
    return await this.notificationQueryRepository.getHistory(
      query.userId,
      query.params,
    );
  }
}
