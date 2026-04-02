import { registerEnumType } from '@nestjs/graphql';

export enum AccountType {
  PERSONAL = 'Personal',
  BUSINESS = 'Business',
}

registerEnumType(AccountType, {
  name: 'AccountType',
  description: 'Тип аккаунта пользователя',
});
