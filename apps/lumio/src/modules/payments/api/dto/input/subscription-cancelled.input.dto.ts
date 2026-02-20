export class InputSubscriptionCancelledDto {
  constructor(
    public id: number,
    public aggregateId: number,
    public aggregateType: string,
    public eventType: string,
    public payload: {
      paymentId: number;
      subscriptionId: string;
      timestamp: string;
    },
    public timestamp: Date,
  ) {}
}
