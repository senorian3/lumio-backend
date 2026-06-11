import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentInputDto {
  @ApiProperty({
    example: 'Nice post',
    description: 'Comment content',
    minLength: 1,
    maxLength: 300,
  })
  @IsString()
  @MinLength(1, { message: 'Comment cannot be empty' })
  @MaxLength(300, { message: 'Comment cannot be longer than 300 characters' })
  content: string;

  @ApiPropertyOptional({
    example: 15,
    description: 'Parent comment ID for creating a reply',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;
}
