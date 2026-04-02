import { registerEnumType } from '@nestjs/graphql';

export enum PaymentSortBy {
  USERNAME_ASC = 'username_asc',
  USERNAME_DESC = 'username_desc',
  DATE_ASC = 'DATE_ASC',
  DATE_DESC = 'DATE_DESC',
  AMOUNT_ASC = 'AMOUNT_ASC',
  AMOUNT_DESC = 'AMOUNT_DESC',
  PAYMENT_METHOD_ASC = 'paymentMethod_asc',
  PAYMENT_METHOD_DESC = 'paymentMethod_desc',
}

registerEnumType(PaymentSortBy, {
  name: 'PaymentSortBy',
  description: 'Сортировка платежей',
});
