import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Post } from '@super-admin/modules/posts/domain/schema/post/post.schema';

@ObjectType()
export class PostFile {
  @Field(() => Int)
  id: number;

  @Field()
  postId: string;

  @Field()
  url: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  deletedAt: Date | null;

  @Field(() => Post, { nullable: true })
  post?: Post;
}
