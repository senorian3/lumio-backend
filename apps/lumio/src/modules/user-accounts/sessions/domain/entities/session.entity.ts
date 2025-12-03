import { Session } from 'generated/prisma-lumio';
import { UserEntity } from '../../../users/domain/entities/user.entity';

export class SessionEntity implements Session {
  id: number;
  deletedAt: Date | null;
  createdAt: Date;
  expiresAt: Date;
  deviceId: string;
  deviceName: string;
  ip: string;
  tokenVersion: number;

  userId: number;
  user?: UserEntity;
}
