import { SessionEntity } from '@lumio/modules/user-accounts/sessions/api/models/session.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../../../sessions/infrastructure/session.repository';

export class LogoutUserCommand {
  constructor(
    public userId: string,
    public deviceId: string,
  ) {}
}

@CommandHandler(LogoutUserCommand)
export class LogoutUserUseCase implements ICommandHandler<LogoutUserCommand> {
  constructor(private authRepository: AuthRepository) {}
  async execute({ userId, deviceId }: LogoutUserCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const foundSessionByDeviceIdAndUserId: SessionEntity | null =
      await this.authRepository.findSession({
        userId: +userId,
        deviceId: deviceId,
      });

    if (!foundSessionByDeviceIdAndUserId) {
      return;
    }

    await this.authRepository.deleteSession(
      foundSessionByDeviceIdAndUserId.id,
      foundSessionByDeviceIdAndUserId.user.id,
    );

    return;
  }
}
