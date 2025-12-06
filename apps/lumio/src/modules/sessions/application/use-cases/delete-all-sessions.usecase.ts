import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { DeleteAllSessionsDto } from '../../api/dto/transfer/delete-all-sessions.dto';
import { SessionEntity } from '../../domain/session.entity';
import { SessionRepository } from '../../domain/infrastructure/session.repository';

export class DeleteAllSessionsCommand {
  constructor(public deleteAllSessionsDto: DeleteAllSessionsDto) {}
}

@CommandHandler(DeleteAllSessionsCommand)
export class DeleteAllSessionssUseCase
  implements ICommandHandler<DeleteAllSessionsCommand>
{
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute({
    deleteAllSessionsDto,
  }: DeleteAllSessionsCommand): Promise<void> {
    const currentSession: SessionEntity | null =
      await this.sessionRepository.findSession({
        userId: deleteAllSessionsDto.userId,
        deviceId: deleteAllSessionsDto.deviceId,
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
      deletedAt: new Date(),
    });

    return;
  }
}
