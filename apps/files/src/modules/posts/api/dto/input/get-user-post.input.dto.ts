import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';
export class GetUserPostsDto {
  @ApiProperty({ type: [Number], example: [41, 40] })
  @IsArray()
  @IsNumber({}, { each: true })
  postIds: number[];
}
