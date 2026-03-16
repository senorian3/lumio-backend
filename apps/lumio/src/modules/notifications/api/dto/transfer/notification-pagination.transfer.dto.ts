import { ApiProperty } from '@nestjs/swagger';
import { NotificationViewDto } from '@lumio/modules/notifications/api/dto/output/notification.output.dto';

export class NotificationPaginationTransferDto {
  @ApiProperty({
    description: 'Array of notification items',
    type: [NotificationViewDto],
    example: [
      {
        id: '550',
        title: 'Подписка активирована',
        message: 'Ваша подписка активирована и действует до 14.04.2026',
        createdAt: '2026-03-14T10:30:00.000Z',
      },
    ],
  })
  items: NotificationViewDto[];

  @ApiProperty({
    description: 'Total number of notifications',
    example: 15,
    minimum: 0,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
    minimum: 1,
  })
  pageNumber: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
  })
  pageSize: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 2,
    minimum: 0,
  })
  pagesCount: number;
}
