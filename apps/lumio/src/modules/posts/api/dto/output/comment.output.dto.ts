export class CommentViewDto {
  id: number;
  content: string;
  likeCount: number;
  dislikeCount: number;
  createdAt: Date;
  userId: number;
  username: string;
  avatarUrl: string | null;
  userReaction: 'none' | 'like' | 'dislike';

  replies?: CommentViewDto[];

  static fromPrismaRoot(
    comment: any,
    replies: CommentViewDto[] = [],
    userReaction: 'none' | 'like' | 'dislike' = 'none',
  ): CommentViewDto {
    return {
      id: comment.id,
      content: comment.content,
      likeCount: comment.likeCount,
      dislikeCount: comment.dislikeCount,
      createdAt: comment.createdAt,
      userId: comment.user.id,
      username: comment.user.username,
      avatarUrl: comment.user.profile?.avatarUrl ?? null,
      userReaction,
      replies,
    };
  }

  static fromPrismaReply(reply: any): CommentViewDto {
    return CommentViewDto.fromPrismaRoot(reply, []);
  }
}
