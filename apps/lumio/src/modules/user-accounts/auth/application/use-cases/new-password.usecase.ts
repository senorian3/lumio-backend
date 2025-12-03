import { NewPasswordDto } from '../../dto/new-password.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../../users/infrastructure/repositories/user.repository';
import { CryptoService } from '../../../adapters/crypto.service';
import { BadRequestDomainException } from '../../../../../../../../libs/core/exceptions/domain-exceptions';

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
