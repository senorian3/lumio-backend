import { Expose, Type } from 'class-transformer';

export class UserProfileOutputDto {
  @Expose()
  id: number;

  @Expose()
  firstName?: string;

  @Expose()
  lastName?: string;

  @Expose()
  dateOfBirth?: Date;

  @Expose()
  country?: string;

  @Expose()
  city?: string;

  @Expose()
  aboutMe?: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  profileFilled: boolean;

  @Expose()
  profileFilledAt?: Date;

  @Expose()
  profileUpdatedAt?: Date;

  @Expose()
  accountType: string;
}

export class UserWithProfileOutputDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  createdAt: Date;

  @Expose()
  isBlocked: boolean;

  @Expose()
  bannedAt?: Date;

  @Expose()
  banReason?: string;

  @Expose()
  @Type(() => UserProfileOutputDto)
  profile?: UserProfileOutputDto;
}
