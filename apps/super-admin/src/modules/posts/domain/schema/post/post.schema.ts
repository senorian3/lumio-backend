import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from '@super-admin/modules/users/domain/schema/user/user.schema';
import { PostFile } from '@super-admin/modules/posts/domain/schema/post/post-file.schema';

@ObjectType()
export class Post {
  @Field()
  id: string;

  @Field({ nullable: true })
  description: string | null;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  deletedAt: Date | null;

  @Field(() => Int)
  userId: number;

  @Field(() => User)
  user: User;

  @Field(() => [PostFile])
  files: PostFile[];
}
