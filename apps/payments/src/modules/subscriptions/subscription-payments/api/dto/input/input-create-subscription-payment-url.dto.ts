export class InputCreateSubscriptionPaymentUrlDto {
  profileId: string;
  currency: string;
  subscriptionType: '1 week' | '2 weeks' | '1 month' | '3 months' | '1 year';
  paymentProvider: string;
}
