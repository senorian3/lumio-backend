import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationParams } from '@libs/core/dto/pagination/base.query-params.input-dto';

export class SearchUsersInputDto extends PaginationParams {
  @ApiProperty({
    description: 'Username to search for',
    example: 'john',
    minLength: 3,
    maxLength: 40,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  username: string;
}
