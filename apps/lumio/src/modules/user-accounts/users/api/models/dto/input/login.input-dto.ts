import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '@libs/core/decorators/transform/trim';

export class loginInputDto {
  @IsEmail(
    {},
    { message: 'The email must match the format example@example.com' },
  )
  email: string;
  @IsString({
    message:
      'Password must contain 0-9, a-z, A-Z, ! " # $ % & \' ( ) * + , - . / : ; < = > ? @ [ \\ ] ^ _ { | } ~ ',
  })
  @MinLength(6, { message: 'Minimum number of characters 6' })
  @MaxLength(20, { message: 'Maximum number of characters 20' })
  @Trim()
  password: string;
}
