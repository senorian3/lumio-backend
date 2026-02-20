export class OutputUserSubscriptionDto {
  constructor(
    public id: string,
    public accountType: string,
    public durationType: string,
    public endDate: Date,
    public nextPaymentDate: Date,
    public autoRenewal: boolean,
  ) {}
}
