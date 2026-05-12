import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';
import { SubscriptionEntity } from '@lumio/modules/user-accounts/users/domain/entities/subscription.entity';
import { UserProfile } from '@generated/prisma-lumio';

export class UserProfileEntity implements UserProfile {
  id: number;

  firstName: string | null;
  lastName: string | null;
  dateOfBirth: Date | null;
  country: string | null;
  city: string | null;
  aboutMe: string | null;
  avatarUrl: string | null;

  profileFilled: boolean;
  profileFilledAt: Date | null;
  profileUpdatedAt: Date | null;

  accountType: string;

  followersCount: number;
  followingCount: number;

  userId: number;
  user: UserEntity;

  subscriptions?: SubscriptionEntity[];
}
