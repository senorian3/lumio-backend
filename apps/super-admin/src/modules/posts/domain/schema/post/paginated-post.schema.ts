import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Post } from '@super-admin/modules/posts/domain/schema/post/post.schema';

@ObjectType()
export class PaginatedPostResponse {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;

  @Field(() => Int)
  pagesCount: number;

  @Field(() => Int)
  totalCount: number;

  @Field(() => [Post])
  items: Post[];
}
