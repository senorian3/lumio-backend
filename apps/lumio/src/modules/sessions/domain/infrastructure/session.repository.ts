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
    userId?: number;
    deviceId?: string;
    deviceName?: string;
  }): Promise<SessionEntity | null> {
    return this.prisma.session.findFirst({
      where: {
        deletedAt: null,
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.deviceId && { deviceId: filters.deviceId }),
        ...(filters.deviceName && { deviceName: filters.deviceName }),
      },
    });
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
      where: {
        userId: dto.userId,
        deviceId: dto.deviceId,
        id: dto.sessionId,
      },
      data: {
        deletedAt: dto.deletedAt,
      },
    });

    return;
  }

  async deleteAllSessionsExcludeCurrent(
    dto: DeleteAllSessionsExcludeCurrentDomainDto,
  ) {
    await this.prisma.session.updateMany({
      where: {
        id: { not: dto.sessionId },
        userId: dto.userId,
      },
      data: {
        deletedAt: dto.deletedAt,
      },
    });

    return;
  }
}
