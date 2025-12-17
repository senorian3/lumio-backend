import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';
import { Post } from 'generated/prisma-lumio';

export class PostEntity implements Post {
  id: number;
  description: string;
  createdAt: Date;
  deletedAt: Date | null;

  userId: number;
  user: UserEntity;
}
