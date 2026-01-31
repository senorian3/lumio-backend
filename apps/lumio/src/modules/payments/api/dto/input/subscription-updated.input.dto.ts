export class InputSubscriptionUpdatedDto {
  constructor(
    public id: number,
    public aggregateId: number,
    public aggregateType: string,
    public eventType: string,
    public payload: {
      paymentId: number;
      subscriptionId: number;
      periodEnd: Date;
      nextPaymentDate: Date;
      timestamp: string;
    },
    public timestamp: Date,
  ) {}
}
