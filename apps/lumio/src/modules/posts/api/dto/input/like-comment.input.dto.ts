import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type LikeStatus = 'like' | 'dislike' | 'none';

export class LikeCommentInputDto {
  @ApiProperty({
    enum: ['like', 'dislike', 'none'],
    example: 'like',
    description: 'Reaction status. Use none to remove the current reaction.',
  })
  @IsIn(['like', 'dislike', 'none'])
  status: LikeStatus;
}
