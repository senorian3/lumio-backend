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
  CHANGE_SUBSCRIPTION_AUTORENEWAL_STRIPE = 'subscription.change.autorenewal.stripe',
  UPDATE_CUSTOMER_SUBSCRIPTION_END_DATE_STRIPE = 'subscription.update.customer.subscription.end.date.stripe',
  CANCEL_SUBSCRIPTION_IMMEDIATELY_STRIPE = 'subscription.cancel.immediately.stripe',
  MANUAL_REVIEW_REQUIRED = 'manual.review.required',
  FAILED_INITIAL_PAYMENT_PROCESSING = 'failed.initial.payment.processing',
  FAILED_RECURRING_PAYMENT_PROCESSING = 'failed.recurring.payment.processing',
  FAILED_SUBSCRIPTION_CHANGE_AUTO_RENEWAL_PROCESSING = 'failed.subscription.change.autorenewal.processing',
  FAILED_SUBSCRIPTION_DELETED_PROCESSING = 'failed.subscription.deleted.processing',
  FAILED_UPDATE_CUSTOMER_SUBSCRIPTION_END_DATE_PROCESSING = 'failed.subscription.update.customer.subscription.end.date.processing',
  FAILED_CANCEL_SUBSCRIPTION_IMMEDIATELY_PROCESSING = 'failed.subscription.cancel.immediately.processing',
  SUBSCRIPTION_DELETED = 'subscription.deleted',
}
