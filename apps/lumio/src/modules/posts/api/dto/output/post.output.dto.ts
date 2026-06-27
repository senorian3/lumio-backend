import { OutputFileType } from '@libs/dto/output/file-output';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';
import { Post } from '@generated/prisma-lumio';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostLikeView {
  @ApiProperty({
    example: 46,
    description: 'ID of the user who liked the post',
  })
  userId: number;

  @ApiProperty({
    example: 'john_doe',
    description: 'Username of the user who liked the post',
  })
  username: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    nullable: true,
    description: 'Avatar URL of the user who liked the post',
  })
  avatarUrl: string | null;

  @ApiProperty({
    example: '2026-02-19T21:17:16.278Z',
    description: 'Date when the like was added',
  })
  addedAt: Date;

  constructor(
    userId: number,
    username: string,
    avatarUrl: string | null,
    addedAt: Date,
  ) {
    this.userId = userId;
    this.username = username;
    this.avatarUrl = avatarUrl;
    this.addedAt = addedAt;
  }

  static fromPrisma(like: any): PostLikeView {
    return new PostLikeView(
      like.userId,
      like.user.username,
      like.user.profile?.avatarUrl ?? null,
      like.addedAt,
    );
  }
}

export class PostView {
  @ApiProperty({
    example: 'a16e733a-30a4-49c8-a923-61e34928aace',
    description: 'Post ID',
  })
  id: string;

  @ApiProperty({
    example: 'My first post',
    description: 'Post description',
  })
  description: string;

  @ApiProperty({
    example: '2026-02-19T21:17:16.278Z',
    description: 'Post creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: 46,
    description: 'ID of the post owner',
  })
  userId: number;
  @ApiProperty({
    example: 'jane_smith',
    description: 'Username of the post owner',
  })
  username: string;

  @ApiProperty({
    example: 'https://example.com/avatar2.jpg',
    nullable: true,
    description: 'Avatar URL of the post owner',
  })
  avatarUrl: string | null;

  @ApiProperty({
    example: 7,
    description: 'Number of comments on the post',
  })
  commentsCount: number;

  @ApiProperty({
    example: 12,
    description: 'Number of likes on the post',
  })
  likeCount: number;

  @ApiProperty({
    example: 2,
    description: 'Number of dislikes on the post',
  })
  dislikeCount: number;

  @ApiProperty({
    enum: ['like', 'dislike', 'none'],
    example: 'none',
    description: 'Current user reaction to the post',
  })
  userReaction: 'like' | 'dislike' | 'none' = 'none';

  @ApiPropertyOptional({
    description: 'Files attached to the post',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 248 },
        url: {
          type: 'string',
          example:
            'https://lumio-files-photo.storage.yandexcloud.net/content/posts/a16e733a-30a4-49c8-a923-61e34928aace/image.png',
        },
        postId: {
          type: 'string',
          example: 'a16e733a-30a4-49c8-a923-61e34928aace',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2026-02-19T21:17:16.278Z',
        },
      },
    },
  })
  postFiles?: OutputFileType[];

  @ApiProperty({
    type: [PostLikeView],
    description: 'Newest likes on the post, limited to the latest 3 likes',
  })
  newestLikes: PostLikeView[] = [];

  static fromEntity(post: PostEntity, allFiles?: OutputFileType[]): PostView {
    const view = new PostView();

    view.id = post.id;
    view.description = post.description;
    view.createdAt = post.createdAt;
    view.userId = post.userId;
    view.username = '';
    view.avatarUrl = null;
    view.commentsCount = 0;

    view.likeCount = post.likeCount;
    view.dislikeCount = post.dislikeCount;

    view.postFiles = allFiles
      ? allFiles
          .filter((file) => file.postId === post.id)
          .map(
            (f) =>
              new OutputFileType(f.id, f.url, f.postId || post.id, f.createdAt),
          )
      : [];

    return view;
  }

  static fromPrisma(
    post: Post & {
      files: any[];
      postLikes?: any[];
      _count?: { comments: number };
      user?: { username: string; profile?: { avatarUrl: string | null } };
    },
    userReaction?: 'like' | 'dislike' | 'none',
    newestLikes?: PostLikeView[],
  ): PostView {
    const view = new PostView();

    view.id = post.id;
    view.description = post.description;
    view.createdAt = post.createdAt;
    view.userId = post.userId;
    view.username = post.user?.username ?? '';
    view.avatarUrl = post.user?.profile?.avatarUrl ?? null;
    view.commentsCount = post._count?.comments ?? 0;

    view.likeCount = post.likeCount;
    view.dislikeCount = post.dislikeCount;

    view.userReaction = userReaction ?? 'none';

    view.postFiles =
      post.files?.map(
        (file) =>
          new OutputFileType(file.id, file.url, file.postId, file.createdAt),
      ) || [];

    if (newestLikes) {
      view.newestLikes = newestLikes;
    }

    return view;
  }
}
