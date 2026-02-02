export class SubscriptionPaymentTransferDto {
  profileId: string;
  currency: string;
  subscriptionType: '1 week' | '2 weeks' | '1 month';
  paymentProvider: string;
}
