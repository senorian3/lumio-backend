export class DeleteAllSessionsExcludeCurrentDomainDto {
  constructor(
    public userId: number,
    public sessionId: number,
  ) {}
}
