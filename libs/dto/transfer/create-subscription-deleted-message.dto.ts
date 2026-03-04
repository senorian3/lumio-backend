export class CreateSubscriptionDeletedMessageDto {
  constructor(
    public stripeSubscriptionId: string,
    public subscriptionId: string,
    public profileId: number,
    public timestamp: string,
  ) {}
}
