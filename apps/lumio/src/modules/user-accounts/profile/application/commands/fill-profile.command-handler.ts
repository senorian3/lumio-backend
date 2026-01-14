import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { ProfileView } from '../../api/dto/output/profile.output.dto';
import { FillProfileTransferDto } from '../../api/dto/transfer/fill-profile.transfer.dto';

export class FillProfileCommand {
  constructor(
    public profileInformation: FillProfileTransferDto,
    public userId: number,
    public requestUserId: number,
  ) {}
}

@CommandHandler(FillProfileCommand)
export class FillProfileCommandHandler implements ICommandHandler<
  FillProfileCommand,
  ProfileView
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: FillProfileCommand): Promise<ProfileView> {
    const user = await this.userRepository.findUserById(command.userId);

    if (!user) {
      throw BadRequestDomainException.create('User is not found', 'userId');
    }

    const userProfile = await this.userRepository.findUserProfileByUserId(
      command.userId,
    );

    if (userProfile) {
      throw BadRequestDomainException.create(
        'Profile already filled',
        'profileFilled',
      );
    }

    if (user.id !== command.requestUserId) {
      throw ForbiddenDomainException.create(
        'User cannot fill profile for another user',
        'userId',
      );
    }

    const filleProfile = await this.userRepository.fillProfile(command.userId, {
      ...command.profileInformation,
      profileFilledAt: new Date(),
      profileFilled: true,
    });

    return ProfileView.fromEntity(user, filleProfile);
  }
}
