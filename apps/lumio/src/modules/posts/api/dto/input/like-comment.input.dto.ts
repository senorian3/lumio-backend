import { IsIn } from 'class-validator';

export type LikeStatus = 'like' | 'dislike' | 'none';

export class LikeCommentInputDto {
  @IsIn(['like', 'dislike', 'none'])
  status: LikeStatus;
}
