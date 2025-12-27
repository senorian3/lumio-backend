import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class InputCreatePostDto {
  @ApiProperty({
    description: 'Description of the post',
    example: 'Hello world',
    required: true,
    nullable: false,
    minLength: 0,
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500, { message: 'Maximum number of characters 500' })
  description: string;
}
