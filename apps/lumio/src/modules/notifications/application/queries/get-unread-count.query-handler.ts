import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotificationQueryRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.query-repository';
import { UnreadCountViewDto } from '@lumio/modules/notifications/api/dto/output/notification.output.dto';

export class GetUnreadCountQuery {
  constructor(public readonly userId: number) {}
}

@QueryHandler(GetUnreadCountQuery)
export class GetUnreadCountQueryHandler implements IQueryHandler<
  GetUnreadCountQuery,
  UnreadCountViewDto
> {
  constructor(
    private readonly notificationQueryRepository: NotificationQueryRepository,
  ) {}

  async execute(query: GetUnreadCountQuery): Promise<UnreadCountViewDto> {
    const unreadCount = await this.notificationQueryRepository.getUnreadCount(
      query.userId,
    );
    return { unreadCount };
  }
}
