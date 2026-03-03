export class UpdateSubscriptionMetadataDto {
  constructor(
    public subscriptionId: string,
    public metadata: Record<string, string>,
    public timestamp: string,
  ) {}
}
