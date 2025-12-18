import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MaxLength(500)
  @MinLength(6)
  description: string;
}
