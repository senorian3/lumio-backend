export class NewPasswordDto {
  constructor(
    public newPassword: string,
    public recoveryCode: string,
  ) {}
}
