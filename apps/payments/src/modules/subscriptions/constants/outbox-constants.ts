export enum OutboxMessageStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
}

export enum OutboxAggregateType {
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
}

export enum OutboxEventType {
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_RECURRING_COMPLETED = 'payment.recurring.completed',
  CHANGE_SUBSCRIPTION_AUTORENEWAL_COMPLETED = 'subscription.change.autorenewal.completed',
  CHANGE_SUBSCRIPTION_AUTORENEWAL_STRIPE = 'subscription.change.autorenewal.stripe',
  MANUAL_REVIEW_REQUIRED = 'manual.review.required',
  FAILED_INITIAL_PAYMENT_PROCESSING = 'failed.initial.payment.processing',
  FAILED_RECURRING_PAYMENT_PROCESSING = 'failed.recurring.payment.processing',
  FAILED_SUBSCRIPTION_CHANGE_AUTO_RENEWAL_PROCESSING = 'failed.subscription.change.autorenewal.processing',
}
