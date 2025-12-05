import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';
import { Session } from 'generated/prisma-lumio';

export class SessionEntity implements Session {
  id: number;
  deletedAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
  deviceId: string;
  deviceName: string;
  ip: string;

  userId: number;
  user?: UserEntity;
}
