import { IsString, MaxLength, MinLength } from 'class-validator';

export class InputCreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  content: string;
}
