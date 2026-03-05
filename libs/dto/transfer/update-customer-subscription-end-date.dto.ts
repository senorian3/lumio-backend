export class UpdateCustomerSubscriptionEndDateDto {
  constructor(
    public stripeSubscriptionId: string,
    public periodEndDate: number,
    public autoRenewal: boolean,
    public timestamp: string,
  ) {}
}
