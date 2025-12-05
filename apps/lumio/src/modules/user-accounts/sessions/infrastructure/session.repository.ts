import { SessionEntity } from '@lumio/modules/user-accounts/sessions/api/models/session.entity';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateSessionDomainDto } from '@lumio/modules/user-accounts/sessions/domain/dto/create-session.domain.dto';
import { UpdateSessionDomainDto } from '../domain/dto/update-sesion.domain.dto';
import { DeleteSessionDomainDto } from '../domain/dto/delete-session.domain.dto';
import { DeleteAllSessionsExcludeCurrentDomainDto } from '../domain/dto/delete-all-sessions-exclude-current.domain.dto';

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
    await this.prisma.session.delete({
      where: {
        userId: dto.userId,
        deviceId: dto.deviceId,
        id: dto.sessionId,
      },
    });

    return;
  }

  async deleteAllSessionsExcludeCurrent(
    dto: DeleteAllSessionsExcludeCurrentDomainDto,
  ) {
    await this.prisma.session.deleteMany({
      where: {
        id: { not: dto.sessionId },
        userId: dto.userId,
      },
    });

    return;
  }
}
