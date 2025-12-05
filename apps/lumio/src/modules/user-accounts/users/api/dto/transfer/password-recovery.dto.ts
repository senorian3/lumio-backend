export class passwordRecoveryDto {
  constructor(
    public email: string,
    public recaptchaToken: string,
  ) {}
}
