import { Payment } from 'generated/prisma-payments';

export class PaymentEntity implements Payment {
  id: number;
  customPaymentId: string;
  paymentProvider: string;
  currency: string;
  amount: number;
  status: string;
  subscriptionId: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  nextPaymentDate: Date | null;
  subscriptionType: string;
  createdAt: Date;
  updatedAt: Date | null;
  profileId: number;
  paymentsUrl: string;
  autoRenewal: boolean;
  cancelledAt: Date | null;
  stripePaymentCreatedAt: Date;
  stripeSubscriptionId: string | null;
  mainSubscriptionId: string | null;
}
