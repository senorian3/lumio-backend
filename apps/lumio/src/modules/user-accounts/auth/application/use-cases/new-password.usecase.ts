import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { NewPasswordDto } from '../../../users/api/models/dto/transfer/new-password.dto';
import { UserRepository } from '@lumio/modules/user-accounts/users/infrastructure/user.repository';

export class NewPasswordCommand {
  constructor(public dto: NewPasswordDto) {}
}

@CommandHandler(NewPasswordCommand)
export class NewPasswordUseCase
  implements ICommandHandler<NewPasswordCommand, void>
{
  constructor(
    private userRepository: UserRepository,
    private cryptoService: CryptoService,
  ) {}

  async execute({ dto }: NewPasswordCommand): Promise<void> {
    const emailConfirmation =
      await this.userRepository.findByCodeOrIdEmailConfirmation({
        code: dto.recoveryCode,
      });
    if (!emailConfirmation) {
      throw BadRequestDomainException.create('User does not exist');
    }

    const newPasswordHash = await this.cryptoService.createPasswordHash(
      dto.newPassword,
    );

    await this.userRepository.updatePassword(
      emailConfirmation.userId,
      newPasswordHash,
    );
  }
}
