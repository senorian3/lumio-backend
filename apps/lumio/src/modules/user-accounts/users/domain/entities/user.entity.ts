import { User } from 'generated/prisma-lumio';
import { EmailConfirmationEntity } from './email-confirmation.entity';
import { SessionEntity } from '../../../sessions/domain/entities/session.entity';
import { GitHubEntity } from './github.entity';
import { SessionEntity } from '@lumio/modules/user-accounts/sessions/domain/entities/session.entity';

export const usernameConstraints = {
  minLength: 6,
  maxLength: 30,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

export class UserEntity implements User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  deletedAt: Date | null;

  emailConfirmation?: EmailConfirmationEntity | null;

  sessions?: SessionEntity[];

  github?: GitHubEntity | null;
}
