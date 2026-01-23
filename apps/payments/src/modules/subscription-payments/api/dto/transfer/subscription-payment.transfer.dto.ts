export class SubscriptionPaymentTransferDto {
  profileId: number;
  currency: string;
  amount: number;
  subscriptionType: string;
  paymentProvider: string;
}
