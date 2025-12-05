import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { SessionEntity } from '@lumio/modules/user-accounts/sessions/domain/session.entity';
import { OutputSessionType } from '../api/dto/output/output';
import { outputSessionsMapper } from '../application/mappers/session.mapper';
@Injectable()
export class QuerySessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSessions(userId: number): Promise<OutputSessionType[]> {
    const allSessions: SessionEntity[] = await this.prisma.session.findMany({
      where: { user: { id: userId } },
    });

    return allSessions.map((sessionData) => outputSessionsMapper(sessionData));
  }
}
