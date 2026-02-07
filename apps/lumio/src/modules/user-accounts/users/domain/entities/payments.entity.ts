import { SubscriptionEntity } from '@lumio/modules/user-accounts/users/domain/entities/subscription.entity';
import { Payments } from 'generated/prisma-lumio';

export class PaymentsEntity implements Payments {
  id: number;
  createdAt: Date;

  amount: number;
  currency: string;
  paymentsService: string;

  subscriptionId!: number;
  subscription?: SubscriptionEntity | null;
}
