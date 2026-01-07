import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { NewPasswordTransferDto } from '@lumio/modules/user-accounts/users/api/dto/transfer/new-password.transfer.dto';

export class NewPasswordCommand {
  constructor(public newPasswordDto: NewPasswordTransferDto) {}
}

@CommandHandler(NewPasswordCommand)
export class NewPasswordCommandHandler implements ICommandHandler<
  NewPasswordCommand,
  void
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cryptoService: CryptoService,
    private readonly sessionRepository: SessionRepository,
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

    await this.sessionRepository.deleteAllSessionsForUser(
      emailConfirmation.userId,
    );

    return;
  }
}
