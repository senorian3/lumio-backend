import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentViewDto {
  @ApiProperty({
    example: 32,
    description: 'Comment ID',
  })
  id: number;

  @ApiProperty({
    example: 'Nice post',
    description: 'Comment content',
  })
  content: string;

  @ApiProperty({
    example: 3,
    description: 'Number of likes on the comment',
  })
  likeCount: number;

  @ApiProperty({
    example: 0,
    description: 'Number of dislikes on the comment',
  })
  dislikeCount: number;

  @ApiProperty({
    example: '2026-02-19T21:17:16.278Z',
    description: 'Comment creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: 46,
    description: 'ID of the comment author',
  })
  userId: number;

  @ApiProperty({
    example: 'john_doe',
    description: 'Username of the comment author',
  })
  username: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    nullable: true,
    description: 'Avatar URL of the comment author',
  })
  avatarUrl: string | null;

  @ApiProperty({
    enum: ['none', 'like', 'dislike'],
    example: 'none',
    description: 'Current user reaction to the comment',
  })
  userReaction: 'none' | 'like' | 'dislike';

  @ApiPropertyOptional({
    type: () => [CommentViewDto],
    description: 'Nested replies to this comment',
  })
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
