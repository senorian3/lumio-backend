import {
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { DeleteSessionTransferDto } from '@lumio/modules/sessions/api/dto/transfer/delete-session.dto';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteSessionCommand {
  constructor(public deleteSessionDto: DeleteSessionTransferDto) {}
}

@CommandHandler(DeleteSessionCommand)
export class DeleteSessionUseCase implements ICommandHandler<DeleteSessionCommand> {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute({ deleteSessionDto }: DeleteSessionCommand): Promise<void> {
    const foundSessionByParamDeviceId: SessionEntity | null =
      await this.sessionRepository.findSession({
        deviceId: deleteSessionDto.paramDeviceId,
      });

    if (!foundSessionByParamDeviceId) {
      throw NotFoundDomainException.create('Device is not found', 'deviceId');
    }

    if (foundSessionByParamDeviceId.userId !== deleteSessionDto.userId) {
      throw ForbiddenDomainException.create(
        "You can't terminate someone else's session!",
        'session',
      );
    }

    if (
      foundSessionByParamDeviceId.deviceId === deleteSessionDto.userDeviceId
    ) {
      throw ForbiddenDomainException.create(
        "You can't terminate your current session!",
        'session',
      );
    }

    await this.sessionRepository.deleteSession({
      deviceId: deleteSessionDto.paramDeviceId,
      userId: deleteSessionDto.userId,
      sessionId: foundSessionByParamDeviceId.id,
      deletedAt: new Date(),
    });

    return;
  }
}
