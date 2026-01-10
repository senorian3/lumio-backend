import { User } from 'generated/prisma-lumio';
import { EmailConfirmationEntity } from './email-confirmation.entity';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';
import { YandexEntity } from '@lumio/modules/user-accounts/users/domain/entities/yandex.entity';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';

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

  firstName: string | null;
  lastName: string | null;
  dateOfBirth: Date | null;
  country: string | null;
  city: string | null;
  aboutMe: string | null;
  profileFilled: boolean;
  profileFilledAt: Date | null;
  profileUpdatedAt: Date | null;
  avatarUrl: string | null;

  emailConfirmation?: EmailConfirmationEntity | null;

  sessions?: SessionEntity[];

  yandex?: YandexEntity | null;

  posts?: PostEntity[];
}
