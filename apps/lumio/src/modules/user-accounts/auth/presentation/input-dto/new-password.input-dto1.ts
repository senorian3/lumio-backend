import { IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../../../../../../../libs/core/decorators/transform/trim';

export class NewPasswordInputDto {
  @MinLength(6, { message: 'Minimum number of characters 6' })
  @MaxLength(20, { message: 'Maximum number of characters 20' })
  @Trim()
  newPassword: string;
  @IsString()
  recoveryCode: string;
}
