export class CreateSessionDomainDto {
  constructor(
    public userId: number,
    public iat: Date,
    public exp: Date,
    public deviceId: string,
    public ip: string,
    public deviceName: string,
  ) {}
}
