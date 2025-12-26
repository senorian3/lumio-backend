export class PasswordRecoveryTransferDto {
  constructor(
    public email: string,
    public recaptchaToken: string,
  ) {}
}
