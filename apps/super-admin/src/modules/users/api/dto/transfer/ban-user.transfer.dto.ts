export class UpdateBanStatusDto {
  constructor(
    public isBlocked: boolean,
    public bannedAt: Date | null,
    public banReason: string | null,
  ) {}
}
