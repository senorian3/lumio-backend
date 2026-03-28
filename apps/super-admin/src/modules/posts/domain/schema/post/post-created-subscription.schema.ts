import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PostCreatedFile {
  @Field()
  id: number;

  @Field()
  url: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PostCreatedUser {
  @Field()
  id: number;
}

@ObjectType()
export class PostCreatedSubscription {
  @Field()
  id: string;

  @Field({ nullable: true })
  description: string | null;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  deletedAt: Date | null;

  @Field(() => PostCreatedUser)
  user: PostCreatedUser;

  @Field(() => [PostCreatedFile])
  files: PostCreatedFile[];
}
