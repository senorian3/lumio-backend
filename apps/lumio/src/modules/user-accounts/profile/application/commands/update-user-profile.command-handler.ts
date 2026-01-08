import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { EditProfileTransferDto } from '@lumio/modules/user-accounts/profile/api/dto/transfer/edit-profile.transfer-dto';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

export class UpdateUserProfileCommand {
  constructor(
    public userProfileInformation: EditProfileTransferDto,
    public userId: number,
  ) {}
}

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileCommandHandler implements ICommandHandler<
  UpdateUserProfileCommand,
  void
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdateUserProfileCommand): Promise<void> {
    const user = await this.userRepository.findUserById(command.userId);
    if (!user) {
      throw BadRequestDomainException.create('User not found', 'User');
    }

    await this.userRepository.updateUserProfile(
      command.userId,
      command.userProfileInformation,
    );

    return;
  }
}
