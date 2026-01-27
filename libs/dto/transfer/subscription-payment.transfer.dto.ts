export class SubscriptionPaymentTransferDto {
  profileId: number;
  currency: string;
  amount: number;
  subscriptionType: '1 week' | '2 weeks' | '1 month';
  paymentProvider: string;
}
