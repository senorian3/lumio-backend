import { SessionEntity } from '@lumio/modules/user-accounts/sessions/domain/entities/session.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';

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
    const foundSessionByDeviceAndUserId: SessionEntity | null =
      await this.authRepository.findSession({
        userId: +userId,
        deviceId: deviceId,
      });

    if (!foundSessionByDeviceAndUserId) {
      return;
    }

    await this.authRepository.deleteSession(
      foundSessionByDeviceAndUserId.id,
      foundSessionByDeviceAndUserId.user.id,
    );

    return;
  }
}
