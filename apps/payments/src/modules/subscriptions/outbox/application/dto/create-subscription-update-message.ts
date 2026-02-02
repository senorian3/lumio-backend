export class CreateSubscriptionUpdateMessageDto {
  constructor(
    public customPaymentId: string,
    public createdAt: Date,
    public amount: number,
    public subscriptionId: string,
    public subscriptionType: string,
    public currentPeriodEnd: Date,
    public nextPaymentDate: Date,
    public timestamp: string,
  ) {}
}
