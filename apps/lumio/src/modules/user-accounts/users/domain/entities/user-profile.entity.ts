import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';

export class UserProfileEntity {
  id: number;

  firstName: string | null;
  lastName: string | null;
  dateOfBirth: Date | null;
  country: string | null;
  city: string | null;
  aboutMe: string | null;
  avatarUrl: string | null;

  profileFilled: boolean;
  profileFilledAt: Date | null;
  profileUpdatedAt: Date | null;

  userId: number;
  user: UserEntity;
}
