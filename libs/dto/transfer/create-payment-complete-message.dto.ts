export class CreatePaymentCompleteMessageDto {
  constructor(
    public paymentId: string,
    public profileId: number,
    public amount: number,
    public currency: string,
    public subscriptionId: string,
    public subscriptionType: string,
    public periodStart: Date,
    public periodEnd: Date,
    public timestamp: string,
    public paymentsService: string,
  ) {}
}
