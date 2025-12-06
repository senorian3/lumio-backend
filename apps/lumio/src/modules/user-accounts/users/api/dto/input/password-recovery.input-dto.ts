import { IsEmail, IsString } from 'class-validator';

export class InputPasswordRecoveryDto {
  @IsEmail()
  email: string;

  @IsString()
  recaptchaToken: string;
}
