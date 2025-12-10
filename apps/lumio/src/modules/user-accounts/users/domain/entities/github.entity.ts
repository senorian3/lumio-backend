import { GitHub } from 'generated/prisma-lumio';
import { UserEntity } from './user.entity';

export class GitHubEntity implements GitHub {
  id: number;
  email: string;
  username: string;
  gitId: string;

  userId: number;

  user: UserEntity;
}
