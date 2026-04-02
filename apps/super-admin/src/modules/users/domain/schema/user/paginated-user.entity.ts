import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '@super-admin/modules/users/domain/schema/user/user.schema';

@ObjectType()
export class PaginatedUserResponse {
  @Field(() => Int, { description: 'Текущая страница' })
  page: number;

  @Field(() => Int, { description: 'Количество записей на странице' })
  pageSize: number;

  @Field(() => Int, { description: 'Общее количество страниц' })
  pagesCount: number;

  @Field(() => Int, { description: 'Общее количество записей' })
  totalCount: number;

  @Field(() => [User], { description: 'Список пользователей' })
  items: User[];
}
