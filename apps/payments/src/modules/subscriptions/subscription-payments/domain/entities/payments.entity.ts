import { Payment } from 'generated/prisma-payments';

export class PaymentEntity implements Payment {
  id!: number;
  paymentProvider!: string;
  currency: string;
  amount: number;
  status: string;
  subscriptionId: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  nextPaymentDate: Date | null;
  subscriptionType: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  profileId: number;
  paymentsUrl: string | null;
  autoRenewal: boolean;
  cancelledAt: Date | null;
  stripePaymentCreatedAt: Date | null;
}
