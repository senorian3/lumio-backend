import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { UpdateSessionDomainDto } from '../dto/update-sesion.domain.dto';
import { DeleteSessionDomainDto } from '../dto/delete-session.domain.dto';
import { DeleteAllSessionsExcludeCurrentDomainDto } from '../dto/delete-all-sessions-exclude-current.domain.dto';
import { CreateSessionDomainDto } from '../dto/create-session.domain.dto';
import { SessionEntity } from '../session.entity';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSession(filters: {
    id?: number;
    userId?: number;
    deviceId?: string;
    deviceName?: string;
  }): Promise<SessionEntity | null> {
    const where: any = { deletedAt: null };

    if (filters.id !== undefined) {
      where.id = filters.id;
    }
    if (filters.userId !== undefined) {
      where.userId = filters.userId;
    }
    if (filters.deviceId !== undefined) {
      where.deviceId = filters.deviceId;
    }
    if (filters.deviceName !== undefined) {
      where.deviceName = filters.deviceName;
    }

    return this.prisma.session.findFirst({ where });
  }

  async updateSession(dto: UpdateSessionDomainDto): Promise<SessionEntity> {
    return this.prisma.session.update({
      where: { id: dto.sessionId },
      data: {
        createdAt: dto.iat,
        expiresAt: dto.exp,
      },
    });
  }
  async createSession(dto: CreateSessionDomainDto): Promise<SessionEntity> {
    return this.prisma.session.create({
      data: {
        userId: dto.userId,
        deviceId: dto.deviceId,
        ip: dto.ip,
        deviceName: dto.deviceName,
        createdAt: dto.iat,
        expiresAt: dto.exp,
      },
    });
  }

  async deleteSession(dto: DeleteSessionDomainDto): Promise<void> {
    await this.prisma.session.update({
      where: { id: dto.sessionId },
      data: { deletedAt: dto.deletedAt },
    });

    return;
  }

  async deleteAllSessionsExcludeCurrent(
    dto: DeleteAllSessionsExcludeCurrentDomainDto,
  ) {
    await this.prisma.session.updateMany({
      where: {
        userId: dto.userId,
        id: { not: dto.sessionId },
      },
      data: { deletedAt: dto.deletedAt },
    });

    return;
  }
}
