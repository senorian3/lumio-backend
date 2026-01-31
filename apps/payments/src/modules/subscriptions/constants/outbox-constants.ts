export enum OutboxMessageStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
}

export enum OutboxAggregateType {
  PAYMENT = 'payment',
}

export enum OutboxEventType {
  PAYMENT_COMPLETED = 'payment.completed',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  CANCEL_SUBSCRIPTION = 'subscription.cancel',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
}
