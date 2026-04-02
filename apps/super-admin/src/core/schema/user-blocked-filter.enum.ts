import { registerEnumType } from '@nestjs/graphql';

export enum UserBlockedFilter {
  ALL = 'ALL',
  BLOCKED = 'BLOCKED',
  NOT_BLOCKED = 'NOT_BLOCKED',
}

registerEnumType(UserBlockedFilter, {
  name: 'UserBlockedFilter',
  description: 'Фильтр по статусу блокировки пользователя',
});
