import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OutputSessionDto } from '@lumio/modules/sessions/api/dto/output/session.output.dto';
import { QuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.query.repository';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';

export class GetAllSessionsQuery {
  constructor(public userId: number) {}
}

@QueryHandler(GetAllSessionsQuery)
export class GetAllSessionsQueryHandler implements IQueryHandler<GetAllSessionsQuery> {
  constructor(
    private readonly querySessionsRepository: QuerySessionsRepository,
  ) {}

  async execute({ userId }: GetAllSessionsQuery): Promise<OutputSessionDto[]> {
    const allSessions: SessionEntity[] =
      await this.querySessionsRepository.getAllSessions(userId);

    return allSessions.map(
      (session) =>
        new OutputSessionDto(
          session.deviceName,
          session.ip,
          session.createdAt.toISOString(),
        ),
    );
  }
}
