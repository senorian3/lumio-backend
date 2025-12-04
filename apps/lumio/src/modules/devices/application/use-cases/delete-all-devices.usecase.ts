import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { AuthRepository } from '@lumio/modules/user-accounts/auth/infrastructure/repositories/auth.repository';
import { SessionEntity } from '@lumio/modules/user-accounts/sessions/domain/entities/session.entity';

export class DeleteAllDevicesCommand {
  constructor(
    public userId: number,
    public deviceId: string,
  ) {}
}

@CommandHandler(DeleteAllDevicesCommand)
export class DeleteAllDevicesUseCase
  implements ICommandHandler<DeleteAllDevicesCommand>
{
  constructor(private readonly authRepository: AuthRepository) {}

  async execute({ userId, deviceId }: DeleteAllDevicesCommand): Promise<void> {
    const currentSession: SessionEntity | null =
      await this.authRepository.findSession({
        userId: userId,
        deviceId: deviceId,
      });

    if (!currentSession) {
      throw BadRequestDomainException.create("Can't delete all sessions");
    }

    await this.authRepository.deleteAllSessionsExcludeCurrent(
      currentSession.id,
      currentSession.user.id,
    );

    return;
  }
}
