import { Payment } from 'generated/prisma-payments';

export class PaymentEntity implements Payment {
  id: number;
  paymentProvider: string;
  currency!: string;
  amount!: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  profileId!: number;
  paymentsUrl: string | null;
}
