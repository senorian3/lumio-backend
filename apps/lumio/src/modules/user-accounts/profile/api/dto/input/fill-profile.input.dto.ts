import { ApiProperty, PickType } from '@nestjs/swagger';
import { InputEditProfileDto } from './edit-profile.input.dto';
import { Trim } from '@libs/core/decorators/transform/trim';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class InputFillProfileDto extends PickType(InputEditProfileDto, [
  'dateOfBirth',
  'country',
  'city',
  'aboutMe',
] as const) {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: true,
    nullable: false,
    maxLength: 100,
    minLength: 1,
  })
  @IsString({ message: 'First name must be a string' })
  @MinLength(1, { message: 'Minimum number of characters 1' })
  @MaxLength(100, { message: 'Maximum number of characters 100' })
  @Trim()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: true,
    nullable: false,
    maxLength: 100,
    minLength: 1,
  })
  @IsString({ message: 'Last name must be a string' })
  @MinLength(1, { message: 'Minimum number of characters 1' })
  @MaxLength(100, { message: 'Maximum number of characters 100' })
  @Trim()
  lastName: string;
}
