export class NewPasswordDto {
  constructor(
    public password: string,
    public recoveryCode: string,
  ) {}
}
