import { IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '@libs/core/decorators/transform/trim';
import { ApiProperty } from '@nestjs/swagger';

export class InputNewPasswordDto {
  @MinLength(6, { message: 'Minimum number of characters 6' })
  @MaxLength(20, { message: 'Maximum number of characters 20' })
  @Trim()
  @ApiProperty({
    description: 'New user password',
    example: 'Password123',
    required: true,
    nullable: false,
  })
  newPassword: string;

  @IsString()
  @ApiProperty({
    description: 'Recovery code for password reset',
    example: '675b54ff-5271-44e4-91ac-a4ec9c1899d2',
    required: true,
    nullable: false,
  })
  recoveryCode: string;
}
