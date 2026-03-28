import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserProfile } from '@super-admin/modules/users/domain/schema/user/user-profile.schema';

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Boolean, { nullable: true })
  isBlocked?: boolean;

  @Field(() => Date, { nullable: true })
  bannedAt?: Date;

  @Field({ nullable: true })
  banReason?: string;

  @Field(() => UserProfile, { nullable: true })
  profile?: UserProfile;
}
