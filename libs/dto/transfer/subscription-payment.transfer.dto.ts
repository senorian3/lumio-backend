import { SubscriptionType } from '@libs/core/types/subscription-type';

export class SubscriptionPaymentTransferDto {
  profileId: string;
  currency: string;
  subscriptionType: SubscriptionType;
  paymentProvider: string;
  localhostOrigin?: string;
}
