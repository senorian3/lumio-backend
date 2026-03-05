export class CreateSubscriptionUpdateMessageDto {
  constructor(
    public paymentId: string,
    public subscriptionId: string,
    public subscriptionType: string,
    public nextPaymentDate: Date,
    public profileId: number,
  ) {}
}
