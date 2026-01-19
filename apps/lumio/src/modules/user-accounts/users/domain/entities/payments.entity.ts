import { UserProfileEntity } from '@lumio/modules/user-accounts/users/domain/entities/user-profile.entity';

export class PaymentsEntity {
  id: number;
  createdAt: Date;
  amount: number;
  paymentsService: string | null;

  userProfileId: number;
  userProfile: UserProfileEntity;
}
