export class CreatePaymentCompleteMessageDto {
  constructor(
    public paymentId: number,
    public profileId: number,
    public amount: number,
    public currency: string,
    public subscriptionId: string,
    public subscriptionType: string,
    public periodStart: Date,
    public periodEnd: Date,
    public nextPaymentDate: Date,
    public timestamp: string,
  ) {}
}
