import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Subscription } from '@super-admin/modules/users/domain/schema/subscription.schema';
import { AccountType } from './account-type.enum';

@ObjectType()
export class UserProfile {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  dateOfBirth?: Date;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  aboutMe?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field()
  profileFilled: boolean;

  @Field({ nullable: true })
  profileFilledAt?: Date;

  @Field({ nullable: true })
  profileUpdatedAt?: Date;

  @Field(() => AccountType)
  accountType: AccountType;

  @Field(() => [Subscription], { nullable: true })
  subscriptions?: Subscription[];
}
