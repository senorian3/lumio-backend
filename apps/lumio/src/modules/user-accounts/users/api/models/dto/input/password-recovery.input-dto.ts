import { IsEmail, IsString } from 'class-validator';

export class PasswordRecoveryInputDto {
  @IsEmail()
  email: string;

  @IsString()
  recaptchaToken: string;
}
