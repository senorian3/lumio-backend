import { registerEnumType } from '@nestjs/graphql';

export enum UserSortBy {
  USERNAME_ASC = 'USERNAME_ASC',
  USERNAME_DESC = 'USERNAME_DESC',
  CREATED_AT_ASC = 'CREATED_AT_ASC',
  CREATED_AT_DESC = 'CREATED_AT_DESC',
}

registerEnumType(UserSortBy, {
  name: 'UserSortBy',
  description: 'Тип сортировки пользователей',
});
