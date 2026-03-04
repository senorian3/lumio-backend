export class UpdateCustomerSubscriptionEndDateDto {
  constructor(
    public stripeSubscriptionId: string,
    public periodEndDate: number,
    public timestamp: string,
  ) {}
}
