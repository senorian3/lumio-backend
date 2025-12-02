import { IsStringWithTrim } from '../../../../../../../../libs/core/decorators/validation/is-string-with-trim';
import {
  passwordConstraints,
  usernameConstraints,
} from '../../../users/domain/entities/user.entity';
import { IsEmail, Matches } from 'class-validator';

export class registrationInputDto {
  @IsStringWithTrim(
    usernameConstraints.minLength,
    usernameConstraints.maxLength,
  )
  @Matches(/^[A-Za-z0-9_-]{6,30}$/, {
    message:
      'Username must be 6-30 characters long and contain only letters, numbers, underscores, or hyphens',
  })
  username: string;

  @IsStringWithTrim(
    passwordConstraints.minLength,
    passwordConstraints.maxLength,
  )
  password: string;

  @IsEmail()
  email: string;
}
