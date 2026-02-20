import { SubscriptionEntity } from '@lumio/modules/user-accounts/users/domain/entities/subscription.entity';
import { Payments } from 'generated/prisma-lumio';

export class PaymentsEntity implements Payments {
  id: string;
  createdAt: Date;

  datePayment: Date; // Добавлено
  endDate: Date;

  amount: number;
  currency: string;
  paymentsService: string;

  subscriptionId: string;
  subscription: SubscriptionEntity | null;
}
