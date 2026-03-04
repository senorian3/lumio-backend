export class UpdatePaymentDomainDto {
  constructor(
    public readonly customPaymentId: string,
    public readonly subscriptionId: string,
    public readonly stripeSubscriptionId: string,
    public readonly mainSubscriptionId: string | null,
    public readonly status: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly nextPaymentDate: Date,
    public readonly autoRenewal: boolean,
  ) {}
}
