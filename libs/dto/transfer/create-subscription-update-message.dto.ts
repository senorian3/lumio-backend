export class CreateSubscriptionUpdateMessageDto {
  constructor(
    public paymentId: string,
    public paymentService: string,
    public amount: number,
    public currency: string,
    public subscriptionId: string,
    public subscriptionType: string,
    public nextPaymentDate: Date,
    public timestamp: string,
  ) {}
}
