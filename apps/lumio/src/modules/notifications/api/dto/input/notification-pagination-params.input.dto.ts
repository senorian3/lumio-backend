import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BaseSortablePaginationParams,
  SortDirection,
} from '@libs/core/dto/pagination/base.query-params.input-dto';

export class NotificationHistoryParams extends BaseSortablePaginationParams<'createdAt'> {
  @ApiPropertyOptional({
    description: 'Page number (starting from 1)',
    example: 1,
    default: 1,
    minimum: 1,
    type: Number,
  })
  pageNumber: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    type: Number,
  })
  pageSize: number = 10;

  @ApiPropertyOptional({
    description: 'Sort direction for notifications by createdAt field',
    example: 'desc',
    default: 'desc',
    enum: SortDirection,
    enumName: 'SortDirection',
  })
  sortDirection: SortDirection = SortDirection.Desc;

  @ApiProperty({
    description: 'Field to sort by (always createdAt for notifications)',
    example: 'createdAt',
    default: 'createdAt',
    enum: ['createdAt'],
    readOnly: true,
  })
  sortBy = 'createdAt' as const;
}
