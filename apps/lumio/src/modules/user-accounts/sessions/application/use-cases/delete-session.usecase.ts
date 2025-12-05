import {
  UnauthorizedDomainException,
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { SessionRepository } from '@lumio/modules/user-accounts/sessions/infrastructure/session.repository';
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
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute({
    userId,
    userDeviceId,
    paramDeviceId,
  }: DeleteSessionCommand): Promise<void> {
    const currentUserSession: SessionEntity | null =
      await this.sessionRepository.findSession({
        userId: userId,
        deviceId: userDeviceId,
      });

    if (!currentUserSession) {
      throw UnauthorizedDomainException.create(
        "User doesn't have session",
        'userId',
      );
    }

    const foundSessionByParamDeviceId: SessionEntity | null =
      await this.sessionRepository.findSession({ deviceId: paramDeviceId });

    if (!foundSessionByParamDeviceId) {
      throw NotFoundDomainException.create('Device is not found', 'deviceId');
    }

    if (
      foundSessionByParamDeviceId.user.id !== userId ||
      foundSessionByParamDeviceId.deviceId === paramDeviceId
    ) {
      throw ForbiddenDomainException.create(
        "You can't terminate current session!",
        'session',
      );
    }

    await this.sessionRepository.deleteSession({
      deviceId: paramDeviceId,
      userId: userId,
      sessionId: foundSessionByParamDeviceId.id,
    });

    return;
  }
}
