export class InputSubscriptionUpdatedDto {
  constructor(
    public id: number,
    public aggregateId: number,
    public aggregateType: string,
    public eventType: string,
    public payload: {
      paymentId: number;
      createdAt: Date;
      amount: number;
      subscriptionId: number;
      subscriptionType: string;
      periodEnd: Date;
      nextPaymentDate: Date;
      timestamp: string;
    },
    public timestamp: Date,
  ) {}
}
