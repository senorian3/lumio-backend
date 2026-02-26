export class CancelSubscriptionImmediatelyDto {
  constructor(
    public subscriptionId: string,
    public timestamp: string,
  ) {}
}
