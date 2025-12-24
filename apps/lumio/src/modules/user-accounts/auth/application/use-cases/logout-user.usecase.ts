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
  constructor(private readonly sessionRepository: SessionRepository) {}
  async execute({ userId, deviceId }: LogoutUserCommand): Promise<void> {
    if (!userId || !deviceId) return;

    const foundSessionByDeviceIdAndUserId: SessionEntity | null =
      await this.sessionRepository.findSession({
        userId: +userId,
        deviceId: deviceId,
      });

    if (!foundSessionByDeviceIdAndUserId) return;

    await this.sessionRepository.updateSession({
      sessionId: foundSessionByDeviceIdAndUserId.id,
      iat: foundSessionByDeviceIdAndUserId.createdAt,
      exp: foundSessionByDeviceIdAndUserId.expiresAt,
      tokenVersion: foundSessionByDeviceIdAndUserId.tokenVersion + 1,
    });

    return;
  }
}
