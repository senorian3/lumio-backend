import { Payment } from 'generated/prisma-payments';

export class PaymentEntity implements Payment {
  id!: number;
  paymentProvider!: string;
  currency!: string;
  amount!: number;
  status!: string;
  subscriptionId: string | null = null;
  periodStart: Date | null = null;
  periodEnd: Date | null = null;
  nextPaymentDate: Date | null = null;
  subscriptionType: string | null = null;
  createdAt!: Date;
  updatedAt!: Date;
  profileId!: number;
  paymentsUrl: string | null = null;
  autoRenewal: boolean = true;
  cancelledAt: Date | null = null;
}
