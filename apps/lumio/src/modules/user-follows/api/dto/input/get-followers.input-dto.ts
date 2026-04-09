import { ApiProperty } from '@nestjs/swagger';
import { PaginationParams } from '@libs/core/dto/pagination/base.query-params.input-dto';

export class GetFollowersInputDto extends PaginationParams {
  @ApiProperty({
    description:
      'User ID to get followers for (optional, defaults to current user)',
    example: 1,
    required: false,
    minimum: 1,
  })
  userId?: number;
}
