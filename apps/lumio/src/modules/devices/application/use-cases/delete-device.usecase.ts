import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../../../user-accounts/auth/infrastructure/repositories/auth.repository';
import { SessionEntity } from '../../../user-accounts/sessions/domain/entities/session.entity';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
  UnauthorizedDomainException,
} from 'libs/core/exceptions/domain-exceptions';

export class DeleteDeviceCommand {
  constructor(
    public userId: number,
    public userDeviceId: string,
    public paramDeviceId: string,
  ) {}
}

@CommandHandler(DeleteDeviceCommand)
export class DeleteDeviceUseCase
  implements ICommandHandler<DeleteDeviceCommand>
{
  constructor(private readonly authRepository: AuthRepository) {}

  async execute({
    userId,
    userDeviceId,
    paramDeviceId,
  }: DeleteDeviceCommand): Promise<void> {
    const currentUserDevice: SessionEntity | null =
      await this.authRepository.findSession({
        userId: userId,
        deviceId: userDeviceId,
      });

    if (!currentUserDevice) {
      throw UnauthorizedDomainException.create(
        "User doesn't have session",
        'userId',
      );
    }

    const foundDevice: SessionEntity | null =
      await this.authRepository.findSession({ deviceId: paramDeviceId });

    if (!foundDevice) {
      throw NotFoundDomainException.create('Device is not found', 'deviceId');
    }

    if (
      foundDevice.user.id !== userId ||
      foundDevice.deviceId === paramDeviceId
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
