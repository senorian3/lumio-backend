import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';
import { Post } from '@generated/prisma-lumio';
import { PostFileEntity } from '@lumio/modules/posts/domain/entities/post-file.entity';

export class PostEntity implements Post {
  id: string;
  description: string;
  likeCount: number = 0;
  dislikeCount: number = 0;
  createdAt: Date;
  deletedAt: Date | null;

  userId: number;
  user: UserEntity;

  files: PostFileEntity[];
}
