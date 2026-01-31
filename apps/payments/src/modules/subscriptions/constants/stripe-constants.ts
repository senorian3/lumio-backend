export enum StripeEventType {
  SESSION_COMPLETED = 'checkout.session.completed',
  INVOICE_PAID = 'invoice.paid',
  SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
}

export enum PaymentStatus {
  SUCCESSFUL = 'successful',
  CANCELLED = `cancelled`,
}

export const subscriptionConfigs = {
  '1 week': {
    interval: 'day' as const,
    intervalCount: 7,
    description: '7 дней',
  },
  '2 weeks': {
    interval: 'day' as const,
    intervalCount: 14,
    description: '14 дней',
  },
  '1 month': {
    interval: 'day' as const,
    intervalCount: 30,
    description: '30 дней',
  },
};
