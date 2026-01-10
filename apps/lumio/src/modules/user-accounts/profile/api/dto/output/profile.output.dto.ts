import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';

export class ProfileView {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
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
    if (user.dateOfBirth) {
      const date = user.dateOfBirth;
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      view.dateOfBirth = `${day}.${month}.${year}`;
    } else {
      view.dateOfBirth = null;
    }
    view.country = user.country || null;
    view.city = user.city || null;
    view.aboutMe = user.aboutMe || null;
    view.avatarUrl = user.avatarUrl || null;

    return view;
  }
}
