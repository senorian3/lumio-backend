import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { SessionRepository } from '@lumio/modules/user-accounts/sessions/infrastructure/session.repository';
import { SessionEntity } from '@lumio/modules/user-accounts/sessions/api/models/session.entity';

export class DeleteAllSessionsCommand {
  constructor(
    public userId: number,
    public deviceId: string,
  ) {}
}

@CommandHandler(DeleteAllSessionsCommand)
export class DeleteAllSessionssUseCase
  implements ICommandHandler<DeleteAllSessionsCommand>
{
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute({ userId, deviceId }: DeleteAllSessionsCommand): Promise<void> {
    const currentSession: SessionEntity | null =
      await this.sessionRepository.findSession({
        userId: userId,
        deviceId: deviceId,
      });

    if (!currentSession) {
      throw BadRequestDomainException.create(
        "Can't delete all sessions",
        'session',
      );
    }

    await this.sessionRepository.deleteAllSessionsExcludeCurrent({
      userId: currentSession.user.id,
      sessionId: currentSession.id,
    });

    return;
  }
}
