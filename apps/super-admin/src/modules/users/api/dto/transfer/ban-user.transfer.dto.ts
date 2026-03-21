export class BanUserTransferDto {
  constructor(
    public isBlocked: boolean,
    public bannedAt: Date,
    public banReason: string,
  ) {}
}
