export class CancelSubscriptionImmediatelyDto {
  constructor(
    public stripeSubscriptionId: string,
    public timestamp: string,
  ) {}
}
