import { registerEnumType } from '@nestjs/graphql';

export enum PostSortBy {
  DATE_ASC = 'date_desc',
  DATE_DESC = 'date_asc',
  USERNAME_ASC = 'username_asc',
  USERNAME_DESC = 'username_desc',
}

registerEnumType(PostSortBy, {
  name: 'PostSortBy',
  description: 'Сортировка постов',
});
