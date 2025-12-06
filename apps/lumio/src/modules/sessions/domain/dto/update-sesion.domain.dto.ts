export class UpdateSessionDomainDto {
  constructor(
    public sessionId: number,
    public iat: Date,
    public exp: Date,
  ) {}
}
