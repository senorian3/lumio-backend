import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { EditProfileTransferDto } from '@lumio/modules/user-accounts/profile/api/dto/transfer/edit-profile.transfer.dto';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { ProfileView } from '../../api/dto/output/profile.output.dto';

export class UpdateUserProfileCommand {
  constructor(
    public userProfileInformation: EditProfileTransferDto,
    public userId: number,
    public requestUserId: number,
  ) {}
}

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileCommandHandler implements ICommandHandler<
  UpdateUserProfileCommand,
  ProfileView
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdateUserProfileCommand): Promise<ProfileView> {
    const user = await this.userRepository.findUserById(command.userId);

    if (!user) {
      throw BadRequestDomainException.create('User not found', 'User');
    }

    if (user.id !== command.requestUserId) {
      throw ForbiddenDomainException.create(
        'User cannot update another user',
        'userId',
      );
    }

    const updatedUser = await this.userRepository.updateUserProfile(
      command.userId,
      command.userProfileInformation,
    );

    return ProfileView.fromEntity(updatedUser);
  }
}
