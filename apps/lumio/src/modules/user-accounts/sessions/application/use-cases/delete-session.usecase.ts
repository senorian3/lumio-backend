import {
  UnauthorizedDomainException,
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { AuthRepository } from '@lumio/modules/user-accounts/sessions/infrastructure/session.repository';
import { SessionEntity } from '@lumio/modules/user-accounts/sessions/api/models/session.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteSessionCommand {
  constructor(
    public userId: number,
    public userDeviceId: string,
    public paramDeviceId: string,
  ) {}
}

@CommandHandler(DeleteSessionCommand)
export class DeleteSessionUseCase
  implements ICommandHandler<DeleteSessionCommand>
{
  constructor(private readonly authRepository: AuthRepository) {}

  async execute({
    userId,
    userDeviceId,
    paramDeviceId,
  }: DeleteSessionCommand): Promise<void> {
    const currentUserSession: SessionEntity | null =
      await this.authRepository.findSession({
        userId: userId,
        deviceId: userDeviceId,
      });

    if (!currentUserSession) {
      throw UnauthorizedDomainException.create(
        "User doesn't have session",
        'userId',
      );
    }

    const foundSession: SessionEntity | null =
      await this.authRepository.findSession({ deviceId: paramDeviceId });

    if (!foundSession) {
      throw NotFoundDomainException.create('Device is not found', 'deviceId');
    }

    if (
      foundSession.user.id !== userId ||
      foundSession.deviceId === paramDeviceId
    ) {
      throw ForbiddenDomainException.create(
        "You can't terminate current session!",
        'userId',
      );
    }

    await this.authRepository.deleteSession(+paramDeviceId, userId);

    return;
  }
}
