export class CreateUserTransferDto {
  constructor(
    public username: string,
    public password: string,
    public email: string,
  ) {}
}
