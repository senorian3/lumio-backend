export class CreateSubscriptionUpdateMessageDto {
  constructor(
    public paymentId: string,
    public createdAt: Date,
    public paymentService: string,
    public amount: number,
    public currency: string,
    public subscriptionId: string,
    public subscriptionType: string,
    public currentPeriodEnd: Date,
    public nextPaymentDate: Date,
    public timestamp: string,
  ) {}
}
