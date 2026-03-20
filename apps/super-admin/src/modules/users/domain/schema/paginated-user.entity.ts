import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '@super-admin/modules/users/domain/schema/user.schema';

@ObjectType()
export class PaginatedUserResponse {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;

  @Field(() => Int)
  pagesCount: number;

  @Field(() => Int)
  totalCount: number;

  @Field(() => [User])
  items: User[];
}
