import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { DeleteAllSessionsTransferDto } from '@lumio/modules/sessions/api/dto/transfer/delete-all-sessions.transfer.dto';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';

export class DeleteAllSessionsCommand {
  constructor(public deleteAllSessionsDto: DeleteAllSessionsTransferDto) {}
}

@CommandHandler(DeleteAllSessionsCommand)
export class DeleteAllSessionsCommandHandler implements ICommandHandler<DeleteAllSessionsCommand> {
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
      userId: currentSession.userId,
      sessionId: currentSession.id,
      deletedAt: new Date(),
    });

    return;
  }
}
