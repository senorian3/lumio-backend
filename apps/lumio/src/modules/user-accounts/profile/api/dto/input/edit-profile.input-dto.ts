import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Trim } from '@libs/core/decorators/transform/trim';
import { ApiProperty } from '@nestjs/swagger';

export class EditProfileInputDto {
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

  @ApiProperty({
    description: 'Date of birth of the user',
    example: '1990-05-20',
    required: false,
    nullable: true,
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date string' })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Country of the user',
    example: 'Belarus',
    required: false,
    nullable: true,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Country must be a string' })
  @MaxLength(100, { message: 'Maximum number of characters 100' })
  @Trim()
  country?: string;

  @ApiProperty({
    description: 'City of the user',
    example: 'Polotsk',
    required: false,
    nullable: true,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  @MaxLength(100, { message: 'Maximum number of characters 100' })
  @Trim()
  city?: string;

  @ApiProperty({
    description: 'Short description about the user',
    example: 'I love backend development and building scalable systems.',
    required: false,
    nullable: true,
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'About me must be a string' })
  @MaxLength(200, { message: 'Maximum number of characters 200' })
  @Trim()
  aboutMe?: string;
}
