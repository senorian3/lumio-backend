export class DeleteSessionDomainDto {
  constructor(
    public deviceId: string,
    public userId: number,
    public sessionId: number,
  ) {}
}
