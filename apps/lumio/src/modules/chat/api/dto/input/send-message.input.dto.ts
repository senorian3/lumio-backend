import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class SendMessageInputDto {
  @IsString({ message: 'The "message" field must be a string' })
  @IsNotEmpty({ message: 'The "message" field cannot be empty' })
  @MinLength(1, { message: 'The message must contain at least 1 character' })
  @MaxLength(500, { message: 'The message must not exceed 500 characters' })
  message: string;
}
