import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

export class RegistrationConfirmationUserCommand {
  constructor(public confirmCode: string) {}
}

@CommandHandler(RegistrationConfirmationUserCommand)
export class RegistrationConfirmationUserUseCase implements ICommandHandler<
  RegistrationConfirmationUserCommand,
  void
> {
  constructor(private userRepository: UserRepository) {}
  async execute({
    confirmCode,
  }: RegistrationConfirmationUserCommand): Promise<void> {
    const userEmailConfirmation =
      await this.userRepository.findByCodeOrIdEmailConfirmation({
        code: confirmCode,
      });

    if (!userEmailConfirmation) {
      throw BadRequestDomainException.create(
        'Confirmation code not found',
        'confirmationCode',
      );
    }
    if (userEmailConfirmation.isConfirmed) {
      throw BadRequestDomainException.create(
        'Confirmation code already used',
        'confirmationCode',
      );
    }
    if (new Date(userEmailConfirmation.expirationDate) < new Date()) {
      throw BadRequestDomainException.create(
        'Confirmation code expired',
        'confirmationCode',
      );
    }

    await this.userRepository.confirmEmail(userEmailConfirmation.userId);

    return;
  }
}
