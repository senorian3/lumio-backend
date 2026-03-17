import { BaseSortablePaginationParams } from '@libs/core/dto/pagination/base.query-params.input-dto';
import { IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export enum NotificationsSortBy {
  CREATED_AT = 'createdAt',
}

export class GetUserNotificationsParams extends BaseSortablePaginationParams<NotificationsSortBy> {
  @IsOptional()
  @IsEnum(NotificationsSortBy)
  @Transform(({ value }) => {
    if (!value) return NotificationsSortBy.CREATED_AT;
    const upperValue = value.toString().toUpperCase();
    return (
      Object.values(NotificationsSortBy).find(
        (v) =>
          v.toUpperCase() === upperValue ||
          v.replace('_', '').toUpperCase() === upperValue,
      ) || NotificationsSortBy.CREATED_AT
    );
  })
  sortBy: NotificationsSortBy = NotificationsSortBy.CREATED_AT;
}
