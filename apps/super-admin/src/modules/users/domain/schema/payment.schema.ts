export interface Payment {
  id: number;
  customPaymentId: string;
  profileId: number;
  autoRenewal: boolean;
  paymentProvider: string;
  currency: string;
  amount: number;
  status: string;
  createdAt: Date;
  nextPaymentDate?: Date;
  stripePaymentCreatedAt: Date;
  updatedAt?: Date;
  cancelledAt?: Date;
  subscriptionId?: string;
  mainSubscriptionId?: string;
  stripeSubscriptionId?: string;
  subscriptionType: string;
  periodStart?: Date;
  periodEnd?: Date;
  paymentsUrl: string;
}
