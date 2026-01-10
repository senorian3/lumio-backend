import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { EditProfileTransferDto } from '@lumio/modules/user-accounts/profile/api/dto/transfer/edit-profile.transfer.dto';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { ProfileView } from '../../api/dto/output/profile.output.dto';

export class UpdateProfileCommand {
  constructor(
    public profileInformation: EditProfileTransferDto,
    public userId: number,
    public requestUserId: number,
  ) {}
}

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileCommandHandler implements ICommandHandler<
  UpdateProfileCommand,
  ProfileView
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdateProfileCommand): Promise<ProfileView> {
    const user = await this.userRepository.findUserById(command.userId);

    if (!user) {
      throw BadRequestDomainException.create('User not found', 'User');
    }

    if (!user.profileFilled) {
      throw BadRequestDomainException.create(
        'Profile not filled',
        'profileFilled',
      );
    }

    if (user.id !== command.requestUserId) {
      throw ForbiddenDomainException.create(
        'User cannot update another user',
        'userId',
      );
    }

    const updatedProfile = await this.userRepository.updateProfile(
      command.userId,
      { ...command.profileInformation, profileUpdatedAt: new Date() },
    );

    return ProfileView.fromEntity(updatedProfile);
  }
}
