import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Trim } from '@libs/core/decorators/transform/trim';
import { ApiProperty } from '@nestjs/swagger';

export class InputRegistrationDto {
  @ApiProperty({
    description: 'Unique username of the user',
    example: 'goodusername',
    required: true,
    nullable: false,
    maxLength: 30,
    minLength: 6,
    pattern: `^[A-Za-z0-9_-]+$`,
  })
  @IsString({ message: 'Username must be a string' })
  @MinLength(6, { message: 'Minimum number of characters 6' })
  @MaxLength(30, { message: 'Maximum number of characters 30' })
  @Trim()
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message:
      'Username must contain only letters, numbers, underscores, or hyphens',
  })
  username: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'Password123',
    required: true,
    nullable: false,
    minLength: 6,
    maxLength: 20,
    pattern: `^[A-Za-z0-9]+$`,
  })
  @IsString({
    message: 'Password must be a string',
  })
  @MinLength(6, { message: 'Minimum number of characters 6' })
  @MaxLength(20, { message: 'Maximum number of characters 20' })
  @Matches(/^[A-Za-z0-9]+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  @Trim()
  password: string;

  @ApiProperty({
    description: 'Unique email of the user',
    example: 'example@example.com',
    required: true,
    format: 'email',
    nullable: false,
    minLength: 6,
    maxLength: 100,
  })
  @IsEmail(
    {},
    { message: 'The email must match the format example@example.com' },
  )
  @MinLength(6, { message: 'Minimum number of characters 6' })
  @MaxLength(100, { message: 'Maximum number of characters 100' })
  email: string;
}
