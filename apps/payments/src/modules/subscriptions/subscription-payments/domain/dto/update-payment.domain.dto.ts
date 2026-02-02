export class UpdatePaymentDomainDto {
  constructor(
    public readonly id: number,
    public readonly status: string,
    public readonly subscriptionId: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly nextPaymentDate: Date,
    public readonly subscriptionType: string,
    public readonly autoRenewal: boolean,
    public readonly stripePaymentCreatedAt: Date,
  ) {}
}
