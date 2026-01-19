import { PaymentsEntity } from '@lumio/modules/user-accounts/users/domain/entities/payments.entity';

export class SubscriptionEntity {
  id: number;
  durationType: string; // лучше сделать enum (согласовать названия)
  startDate: Date;
  endDate: Date;
  autoRenewal: boolean = false; // Значение по умолчанию

  paymentId: number;
  payment: PaymentsEntity; // Обязательная связь 1-к-1
}
