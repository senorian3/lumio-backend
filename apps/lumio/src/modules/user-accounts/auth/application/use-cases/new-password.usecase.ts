import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { NewPasswordDto } from '../../../users/api/dto/transfer/new-password.dto';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';

export class NewPasswordCommand {
  constructor(public newPasswordDto: NewPasswordDto) {}
}

@CommandHandler(NewPasswordCommand)
export class NewPasswordUseCase
  implements ICommandHandler<NewPasswordCommand, void>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cryptoService: CryptoService,
  ) {}

  async execute({ newPasswordDto }: NewPasswordCommand): Promise<void> {
    const emailConfirmation =
      await this.userRepository.findByCodeOrIdEmailConfirmation({
        code: newPasswordDto.recoveryCode,
      });

    if (!emailConfirmation) {
      throw BadRequestDomainException.create('User does not exist', 'code');
    }

    const newPasswordHash = await this.cryptoService.createPasswordHash(
      newPasswordDto.password,
    );

    await this.userRepository.updatePassword(
      emailConfirmation.userId,
      newPasswordHash,
    );

    return;
  }
}
