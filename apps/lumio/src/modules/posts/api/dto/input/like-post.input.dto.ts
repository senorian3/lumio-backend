import { IsIn } from 'class-validator';

export type LikePostStatus = 'like' | 'dislike' | 'none';

export class LikePostInputDto {
  @IsIn(['like', 'dislike', 'none'])
  status: LikePostStatus;
}
