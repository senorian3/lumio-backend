import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class LogoutUserCommand {
  constructor(
    public userId: string,
    public deviceId: string,
  ) {}
}

@CommandHandler(LogoutUserCommand)
export class LogoutUserUseCase implements ICommandHandler<LogoutUserCommand> {
  constructor(private sessionRepository: SessionRepository) {}
  async execute({ userId, deviceId }: LogoutUserCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const foundSessionByDeviceIdAndUserId: SessionEntity | null =
      await this.sessionRepository.findSession({
        userId: +userId,
        deviceId: deviceId,
      });

    if (!foundSessionByDeviceIdAndUserId) {
      return;
    }

    await this.sessionRepository.deleteSession({
      userId: foundSessionByDeviceIdAndUserId.user.id,
      deviceId: foundSessionByDeviceIdAndUserId.deviceId,
      sessionId: foundSessionByDeviceIdAndUserId.id,
    });

    return;
  }
}
