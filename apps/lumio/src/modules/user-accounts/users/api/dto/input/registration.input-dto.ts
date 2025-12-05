import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Trim } from '@libs/core/decorators/transform/trim';

export class InputRegistrationDto {
  @IsString({ message: 'Username must be a string' })
  @MinLength(6, { message: 'Minimum number of characters 6' })
  @MaxLength(30, { message: 'Maximum number of characters 30' })
  @Trim()
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message:
      'Username must contain only letters, numbers, underscores, or hyphens',
  })
  username: string;

  @IsString({
    message:
      'Password must contain 0-9, a-z, A-Z, ! " # $ % & \' ( ) * + , - . / : ; < = > ? @ [ \\ ] ^ _ { | } ~ ',
  })
  @MinLength(6, { message: 'Minimum number of characters 6' })
  @MaxLength(20, { message: 'Maximum number of characters 20' })
  @Trim()
  password: string;

  @IsEmail(
    {},
    { message: 'The email must match the format example@example.com' },
  )
  email: string;
}
