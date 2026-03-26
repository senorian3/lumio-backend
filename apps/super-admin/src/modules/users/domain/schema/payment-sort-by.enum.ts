import { registerEnumType } from '@nestjs/graphql';

export enum PaymentSortBy {
  USERNAME_ASC = 'username_asc',
  USERNAME_DESC = 'username_desc',
  CREATED_AT_ASC = 'createdAt_asc',
  CREATED_AT_DESC = 'createdAt_desc',
  AMOUNT_ASC = 'amount_asc',
  AMOUNT_DESC = 'amount_desc',
  PAYMENT_METHOD_ASC = 'paymentMethod_asc',
  PAYMENT_METHOD_DESC = 'paymentMethod_desc',
}

registerEnumType(PaymentSortBy, {
  name: 'PaymentSortBy',
  description: 'Сортировка платежей',
});
