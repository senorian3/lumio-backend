import { OutputFilesDto } from '@libs/rabbitmq/dto/output';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';

export class PostView {
  id: number;
  description: string;
  createdAt: Date;

  userId: number;

  postFiles: OutputFilesDto[];

  static fromEntity(post: PostEntity, files: OutputFilesDto[]): PostView {
    const view = new PostView();

    view.id = post.id;
    view.description = post.description;
    view.createdAt = post.createdAt;
    view.userId = post.userId;

    view.postFiles = files.map((f) => new OutputFilesDto(f.id, f.url));

    return view;
  }
}
