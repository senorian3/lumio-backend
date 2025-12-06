export class CreateUserDomainDto {
  constructor(
    public username: string,
    public password: string,
    public email: string,
  ) {}
}
