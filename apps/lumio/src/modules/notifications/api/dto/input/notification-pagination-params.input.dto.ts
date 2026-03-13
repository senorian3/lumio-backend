import { BaseSortablePaginationParams } from '@libs/core/dto/pagination/base.query-params.input-dto';

export class NotificationHistoryParams extends BaseSortablePaginationParams<'createdAt'> {
  sortBy: 'createdAt' = `createdAt`;
}
