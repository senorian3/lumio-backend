import { IsString, MaxLength, MinLength } from 'class-validator';

export class InputUpdatePostDto {
  @IsString()
  @MaxLength(500)
  @MinLength(6)
  description: string;
}
