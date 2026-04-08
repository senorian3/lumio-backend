import { OutputFileType } from '@libs/dto/output/file-output';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';
import { Post } from 'generated/prisma-lumio';

export class PostLikeView {
  userId: number;
  username: string;
  avatarUrl: string | null;
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
  id: string;
  description: string;
  createdAt: Date;

  userId: number;

  likeCount: number;
  dislikeCount: number;

  userReaction: 'like' | 'dislike' | 'none' = 'none';

  postFiles?: OutputFileType[];
  newestLikes: PostLikeView[] = [];

  static fromEntity(post: PostEntity, allFiles?: OutputFileType[]): PostView {
    const view = new PostView();

    view.id = post.id;
    view.description = post.description;
    view.createdAt = post.createdAt;
    view.userId = post.userId;

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
    post: Post & { files: any[]; postLikes?: any[] },
    userReaction?: 'like' | 'dislike' | 'none',
    newestLikes?: PostLikeView[],
  ): PostView {
    const view = new PostView();

    view.id = post.id;
    view.description = post.description;
    view.createdAt = post.createdAt;
    view.userId = post.userId;

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
