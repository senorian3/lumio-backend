export enum StripeEventType {
  SESSION_COMPLETED = 'checkout.session.completed',
  INVOICE_PAID = 'invoice.paid',
  SUBSCRIPTION_CANCELLED = 'customer.subscription.deleted',
}

export enum PaymentStatus {
  SUCCESSFUL = 'successful',
  CANCELLED = `cancelled`,
  COMPLETED = 'completed',
}

export const subscriptionConfigs = {
  '1 week': {
    interval: 'week' as const,
    intervalCount: 1,
    description: '1 неделя',
  },

  '2 weeks': {
    interval: 'week' as const,
    intervalCount: 2,
    description: '2 недели',
  },

  '1 month': {
    interval: 'month' as const,
    intervalCount: 1,
    description: '1 месяц',
  },

  '3 months': {
    interval: 'month' as const,
    intervalCount: 3,
    description: '3 месяца',
  },

  '1 year': {
    interval: 'year' as const,
    intervalCount: 1,
    description: '1 год',
  },
};

export const SUBSCRIPTION_PRICES = {
  '1 week': 2.99,
  '2 weeks': 5.39,
  '1 month': 9.99,
  '3 months': 23.99,
  '1 year': 71.99,
};
