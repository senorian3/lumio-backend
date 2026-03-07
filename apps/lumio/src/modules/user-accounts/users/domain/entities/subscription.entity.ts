import { UserProfileEntity } from '@lumio/modules/user-accounts/users/domain/entities/user-profile.entity';
import { Subscription } from 'generated/prisma-lumio';

export class SubscriptionEntity implements Subscription {
  id: number;

  subscriptionId: string;
  durationType: string;

  startDate: Date;
  endDate: Date;

  autoRenewal: boolean = false;

  userProfileId: number;
  userProfile: UserProfileEntity;
}
