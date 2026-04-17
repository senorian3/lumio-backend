import {
  IsNumber,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsPositive,
} from 'class-validator';

export class SendMessageInputDto {
  @IsNumber({}, { message: 'The "userId" field must be a number' })
  @IsNotEmpty({ message: 'The "userId" field cannot be empty' })
  @IsPositive({ message: 'The "userId" must be a positive number' })
  userId: number;

  @IsNumber({}, { message: 'The "recipientId" field must be a number' })
  @IsNotEmpty({ message: 'The "recipientId" field cannot be empty' })
  @IsPositive({ message: 'The "recipientId" must be a positive number' })
  recipientId: number;

  @IsString({ message: 'The "message" field must be a string' })
  @IsNotEmpty({ message: 'The "message" field cannot be empty' })
  @MinLength(1, { message: 'The message must contain at least 1 character' })
  @MaxLength(500, { message: 'The message must not exceed 500 characters' })
  message: string;
}
