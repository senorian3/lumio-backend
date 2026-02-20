export class CreateSubscriptionDeletedMessageDto {
  constructor(
    public subscriptionId: string,
    public profileId: number,
    public timestamp: string,
  ) {}
}
