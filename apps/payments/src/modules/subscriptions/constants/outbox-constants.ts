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
  CANCEL_SUBSCRIPTION_AUTO_RENEWAL = 'subscription.cancel.auto.renewal',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  MANUAL_REVIEW_REQUIRED = 'manual.review.required',
  FAILED_INITIAL_PAYMENT_PROCESSING = 'failed.initial.payment.processing',
  FAILED_RECURRING_PAYMENT_PROCESSING = 'failed.recurring.payment.processing',
}
