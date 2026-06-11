import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type LikePostStatus = 'like' | 'dislike' | 'none';

export class LikePostInputDto {
  @ApiProperty({
    enum: ['like', 'dislike', 'none'],
    example: 'like',
    description: 'Reaction status. Use none to remove the current reaction.',
  })
  @IsIn(['like', 'dislike', 'none'])
  status: LikePostStatus;
}
