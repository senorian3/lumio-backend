import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';
import { UserProfileEntity } from '@lumio/modules/user-accounts/users/domain/entities/user-profile.entity';

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

  static fromEntity(
    user: UserEntity,
    userProfile: UserProfileEntity | null | undefined,
  ): ProfileView {
    const view = new ProfileView();

    view.id = user.id;
    view.username = user.username;

    view.firstName = userProfile?.firstName || null;
    view.lastName = userProfile?.lastName || null;
    view.country = userProfile?.country || null;
    view.city = userProfile?.city || null;
    view.aboutMe = userProfile?.aboutMe || null;
    view.avatarUrl = userProfile?.avatarUrl || null;

    if (userProfile?.dateOfBirth) {
      const date = userProfile.dateOfBirth;
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      view.dateOfBirth = `${day}.${month}.${year}`;
    } else {
      view.dateOfBirth = null;
    }

    return view;
  }
}
