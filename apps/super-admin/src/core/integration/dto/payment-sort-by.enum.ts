import { registerEnumType } from '@nestjs/graphql';

export enum PaymentSortBy {
  DATE_ASC = 'DATE_ASC',
  DATE_DESC = 'DATE_DESC',
  AMOUNT_ASC = 'AMOUNT_ASC',
  AMOUNT_DESC = 'AMOUNT_DESC',
}

registerEnumType(PaymentSortBy, {
  name: 'PaymentSortBy',
  description: 'Сортировка платежей',
});
