import { ApiProperty } from '@nestjs/swagger';
import { NotificationPaginationTransferDto } from '@lumio/modules/notifications/api/dto/transfer/notification-pagination.transfer.dto';
import { NotificationViewDto } from '@lumio/modules/notifications/api/dto/output/notification.output.dto';

export class NotificationPaginationOutputDto extends NotificationPaginationTransferDto {
  @ApiProperty({
    description: 'Array of notification items',
    type: [NotificationViewDto],
    isArray: true,
  })
  declare items: NotificationViewDto[];

  @ApiProperty({
    description: 'Total number of notifications for the user',
    example: 15,
    minimum: 0,
    type: Number,
  })
  declare total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
    minimum: 1,
    type: Number,
  })
  declare pageNumber: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    type: Number,
  })
  declare pageSize: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 2,
    minimum: 0,
    type: Number,
  })
  declare pagesCount: number;
}
