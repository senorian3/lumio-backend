import { OutputFileType } from '@libs/dto/output/file-output';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';
import { Post } from 'generated/prisma-lumio';

export class PostView {
  id: string;
  description: string;
  createdAt: Date;

  likeCount: number;
  dislikeCount: number;

  userId: number;

  postFiles?: OutputFileType[];

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

  static fromPrisma(post: Post & { files: any[] }): PostView {
    const view = new PostView();

    view.id = post.id;
    view.description = post.description;
    view.createdAt = post.createdAt;
    view.userId = post.userId;

    view.likeCount = post.likeCount;
    view.dislikeCount = post.dislikeCount;

    view.postFiles =
      post.files?.map(
        (file) =>
          new OutputFileType(file.id, file.url, file.postId, file.createdAt),
      ) || [];

    return view;
  }
}
