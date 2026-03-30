import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Post } from '@super-admin/modules/posts/domain/schema/post/post.schema';

@ObjectType()
export class PaginatedPostResponse {
  @Field(() => Int, { description: 'Текущая страница' })
  page: number;

  @Field(() => Int, { description: 'Количество записей на странице' })
  pageSize: number;

  @Field(() => Int, { description: 'Общее количество страниц' })
  pagesCount: number;

  @Field(() => Int, { description: 'Общее количество записей' })
  totalCount: number;

  @Field(() => [Post], { description: 'Список постов' })
  items: Post[];
}
