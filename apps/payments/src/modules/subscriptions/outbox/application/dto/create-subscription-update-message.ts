export class CreateSubscriptionUpdateMessageDto {
  constructor(
    public paymentId: number,
    public createdAt: Date,
    public amount: number,
    public subscriptionId: string,
    public subscriptionType: string,
    public currentPeriodEnd: Date,
    public nextPaymentDate: Date,
    public timestamp: string,
  ) {}
}
