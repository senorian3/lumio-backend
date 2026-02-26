export class UpdateCustomerSubscriptionEndDateDto {
  constructor(
    public subscriptionId: string,
    public periodEndDate: number,
    public timestamp: string,
  ) {}
}
