export class UpdateSubscriptionMetadataDto {
  constructor(
    public stripeSubscriptionId: string,
    public metadata: Record<string, string>,
    public timestamp: string,
  ) {}
}
