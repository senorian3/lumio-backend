import { Google } from 'generated/prisma-lumio';
import { UserEntity } from './user.entity';

export class GoogleEntity implements Google {
  id: number;
  email: string;
  username: string;
  googleId: string;

  userId: number;

  user: UserEntity;
}
