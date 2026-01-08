import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';

export class ProfileView {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  country?: string;
  city?: string;
  aboutMe?: string;
  avatarUrl?: string;

  static fromEntity(user: UserEntity): ProfileView {
    const view = new ProfileView();

    view.id = user.id;
    view.username = user.username;
    view.firstName = user.firstName || null;
    view.lastName = user.lastName || null;
    view.dateOfBirth = user.dateOfBirth || null;
    view.country = user.country || null;
    view.city = user.city || null;
    view.aboutMe = user.aboutMe || null;
    view.avatarUrl = user.avatarUrl || null;

    return view;
  }
}
