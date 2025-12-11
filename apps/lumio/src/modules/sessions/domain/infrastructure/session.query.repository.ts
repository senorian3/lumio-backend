import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { OutputSessionType } from '../../api/dto/output/output';
import { SessionEntity } from '../session.entity';
@Injectable()
export class QuerySessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSessions(userId: number): Promise<OutputSessionType[]> {
    const allSessions: SessionEntity[] = await this.prisma.session.findMany({
      where: { user: { id: userId }, deletedAt: null },
    });

    return allSessions.map(
      (session) =>
        new OutputSessionType(
          session.deviceName,
          session.ip,
          session.createdAt.toISOString(),
        ),
    );
  }
}
