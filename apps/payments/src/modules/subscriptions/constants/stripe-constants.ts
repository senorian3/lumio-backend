import { SubscriptionType } from '@libs/core/types/subscription-type';

export enum StripeEventType {
  INVOICE_PAID = 'invoice.paid',
  CHECKOUT_SESSION_COMPLETED = 'checkout.session.completed',
  CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
}

export enum StripeBillingReason {
  SUBSCRIPTION_CREATE = 'subscription_create',
  SUBSCRIPTION_CYCLE = 'subscription_cycle',
}

export enum PaymentStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  EXTENSION = 'extension',
  PENDING = 'pending',
}

export const subscriptionConfigs: Record<
  SubscriptionType,
  {
    interval: 'week' | 'month' | 'year';
    intervalCount: number;
    description: string;
  }
> = {
  [SubscriptionType.ONE_WEEK]: {
    interval: 'week',
    intervalCount: 1,
    description: '1 неделя',
  },
  [SubscriptionType.TWO_WEEKS]: {
    interval: 'week',
    intervalCount: 2,
    description: '2 недели',
  },
  [SubscriptionType.ONE_MONTH]: {
    interval: 'month',
    intervalCount: 1,
    description: '1 месяц',
  },
  [SubscriptionType.THREE_MONTHS]: {
    interval: 'month',
    intervalCount: 3,
    description: '3 месяца',
  },
  [SubscriptionType.ONE_YEAR]: {
    interval: 'year',
    intervalCount: 1,
    description: '1 год',
  },
};

export const SUBSCRIPTION_PRICES: Record<SubscriptionType, number> = {
  [SubscriptionType.ONE_WEEK]: 2.99,
  [SubscriptionType.TWO_WEEKS]: 5.39,
  [SubscriptionType.ONE_MONTH]: 9.99,
  [SubscriptionType.THREE_MONTHS]: 23.99,
  [SubscriptionType.ONE_YEAR]: 71.99,
};
