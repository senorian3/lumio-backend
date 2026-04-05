import { Expose } from 'class-transformer';

export class CommentViewDto {
  @Expose()
  id: number;

  @Expose()
  content: string;

  @Expose()
  likeCount: number;

  @Expose()
  dislikeCount: number;

  @Expose()
  createdAt: Date;

  @Expose()
  userId: number;

  @Expose()
  username: string;

  @Expose()
  avatarUrl: string | null;
}
