import { PaymentsEntity } from '@lumio/modules/user-accounts/users/domain/entities/payments.entity';
import { UserProfileEntity } from '@lumio/modules/user-accounts/users/domain/entities/user-profile.entity';
import { Subscription } from 'generated/prisma-lumio';

export class SubscriptionEntity implements Subscription {
  id: string;

  subscriptionId: string;
  durationType: string;

  startDate: Date;
  endDate: Date;

  autoRenewal: boolean = false;
  cancelledAt: Date | null;

  userProfileId: number;
  userProfile: UserProfileEntity;

  payments?: PaymentsEntity[];
}
