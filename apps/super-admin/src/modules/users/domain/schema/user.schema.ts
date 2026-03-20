import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserProfile } from '@super-admin/modules/users/domain/schema/user-profile.schema';

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  createdAt: Date;

  @Field(() => UserProfile, { nullable: true })
  profile?: UserProfile;
}
