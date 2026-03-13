import { NotificationOutputDto } from '@lumio/modules/notifications/api/dto/output/notification.output.dto';

export class NotificationPaginationTransferDto {
  items: NotificationOutputDto[];
  total: number;
  pageNumber: number;
  pageSize: number;
  pagesCount: number;
}
