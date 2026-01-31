export class InputPaymentCompletedDto {
  constructor(
    public id: number,
    public aggregateId: number,
    public aggregateType: string,
    public eventType: string,
    public payload: {
      paymentId: number;
      profileId: number;
      amount: number;
      currency: string;
      subscriptionId: string;
      subscriptionType: string;
      periodStart: Date;
      periodEnd: Date;
      nextPaymentDate: Date;
      timestamp: string;
    },
    public timestamp: Date,
  ) {}
}
