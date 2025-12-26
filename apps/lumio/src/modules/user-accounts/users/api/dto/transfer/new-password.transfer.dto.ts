export class NewPasswordTransferDto {
  constructor(
    public password: string,
    public recoveryCode: string,
  ) {}
}
