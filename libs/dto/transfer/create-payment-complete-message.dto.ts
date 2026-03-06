export class CreatePaymentCompleteMessageDto {
  constructor(
    public profileId: number,
    public paymentId: string,
    public subscriptionId: string,
    public subscriptionType: string,
    public periodStart: Date,
    public periodEnd: Date,
  ) {}
}
