import {
  IsNumber,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@libs/core/decorators/transform/trim';

export class SendMessageInputDto {
  @ApiProperty({
    description: 'Recipient user ID',
    example: 12,
    minimum: 1,
  })
  @IsNumber({}, { message: 'The "recipientId" field must be a number' })
  @IsNotEmpty({ message: 'The "recipientId" field cannot be empty' })
  @IsPositive({ message: 'The "recipientId" must be a positive number' })
  recipientId: number;

  @ApiProperty({
    description: 'Text message content',
    example: 'hello',
    minLength: 1,
    maxLength: 500,
  })
  @IsString({ message: 'The "message" field must be a string' })
  @Trim()
  @IsNotEmpty({ message: 'The "message" field cannot be empty' })
  @MinLength(1, { message: 'The message must contain at least 1 character' })
  @MaxLength(500, { message: 'The message must not exceed 500 characters' })
  message: string;
}
