import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { QuerySessionsRepository } from '../../domain/infrastructure/session.query.repository';
import { OutputSessionDto } from '../../api/dto/output/output';
import { SessionEntity } from '../../domain/session.entity';

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
