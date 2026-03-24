import { Payment } from './payment.schema';

export interface PaginatedPaymentResponse {
  page: number;
  pageSize: number;
  pagesCount: number;
  totalCount: number;
  items: Payment[];
}
