import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';

export class PostView {
  id: number;
  description: string;
  createdAt: Date;

  userId: number;

  postFiles?: OutputFileType[];

  static fromEntity(post: PostEntity, allFiles?: OutputFileType[]): PostView {
    const view = new PostView();

    view.id = post.id;
    view.description = post.description;
    view.createdAt = post.createdAt;
    view.userId = post.userId;

    view.postFiles = allFiles
      ? allFiles
          .filter(
            (file) =>
              file.postId === post.id ||
              (file.postId === undefined && file.id === post.id),
          )
          .map((f) => new OutputFileType(f.id, f.url, f.postId || post.id))
      : [];

    return view;
  }
}
