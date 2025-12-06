import {
  UnauthorizedDomainException,
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteSessionDto } from '../../api/dto/transfer/delete-session.dto';
import { SessionEntity } from '../../domain/session.entity';
import { SessionRepository } from '../../domain/infrastructure/session.repository';

export class DeleteSessionCommand {
  constructor(public deleteSessionDto: DeleteSessionDto) {}
}

@CommandHandler(DeleteSessionCommand)
export class DeleteSessionUseCase
  implements ICommandHandler<DeleteSessionCommand>
{
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute({ deleteSessionDto }: DeleteSessionCommand): Promise<void> {
    const currentUserSession: SessionEntity | null =
      await this.sessionRepository.findSession({
        userId: deleteSessionDto.userId,
        deviceId: deleteSessionDto.userDeviceId,
      });

    if (!currentUserSession) {
      throw UnauthorizedDomainException.create(
        "User doesn't have session",
        'userId',
      );
    }

    const foundSessionByParamDeviceId: SessionEntity | null =
      await this.sessionRepository.findSession({
        deviceId: deleteSessionDto.paramDeviceId,
      });

    if (!foundSessionByParamDeviceId) {
      throw NotFoundDomainException.create('Device is not found', 'deviceId');
    }

    if (
      foundSessionByParamDeviceId.user.id !== deleteSessionDto.userId ||
      foundSessionByParamDeviceId.deviceId === deleteSessionDto.paramDeviceId
    ) {
      throw ForbiddenDomainException.create(
        "You can't terminate current session!",
        'session',
      );
    }

    await this.sessionRepository.deleteSession({
      deviceId: deleteSessionDto.paramDeviceId,
      userId: deleteSessionDto.userId,
      sessionId: foundSessionByParamDeviceId.id,
    });

    return;
  }
}
