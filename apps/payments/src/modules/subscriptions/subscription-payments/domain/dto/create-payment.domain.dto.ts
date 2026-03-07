export class CreatePaymentDomainDto {
  constructor(
    public readonly paymentProvider: string,
    public readonly currency: string,
    public readonly amount: number,
    public readonly profileId: number,
    public readonly status: string,
    public readonly subscriptionType: string,
    public readonly stripeSubscriptionId: string | null,
    public readonly mainSubscriptionId: string | null,
    public readonly autoRenewal: boolean,
    public readonly subscriptionId: string | null,
    public readonly periodStart: Date | null,
    public readonly periodEnd: Date | null,
    public readonly nextPaymentDate: Date | null,
    public readonly createdAt: Date,
    public readonly paymentsUrl: string,
    public readonly stripePaymentCreatedAt: Date,
    public readonly cancelledAt: Date | null,
    public readonly customPaymentId: string,
  ) {}
}
