import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentInputDto {
  @IsString()
  @MinLength(1, { message: 'Comment cannot be empty' })
  @MaxLength(300, { message: 'Comment cannot be longer than 300 characters' })
  content: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;
}
