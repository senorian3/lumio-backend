import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { OutputSessionDto } from '@lumio/modules/sessions/api/dto/output/session.output.dto';
import { QuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.query.repository';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';

export class GetAllSessionsCommand {
  constructor(public userId: number) {}
}

@QueryHandler(GetAllSessionsCommand)
export class GetAllSessionsUseCase implements IQueryHandler<GetAllSessionsCommand> {
  constructor(
    private readonly querySessionsRepository: QuerySessionsRepository,
  ) {}

  async execute({
    userId,
  }: GetAllSessionsCommand): Promise<OutputSessionDto[]> {
    const allSessions: SessionEntity[] =
      await this.querySessionsRepository.getAllSessions(userId);

    if (!allSessions) {
      throw BadRequestDomainException.create('Cant get all devices', 'userId');
    }

    const mappedSessions = allSessions.map(
      (session) =>
        new OutputSessionDto(
          session.deviceName,
          session.ip,
          session.createdAt.toISOString(),
        ),
    );

    return mappedSessions;
  }
}
