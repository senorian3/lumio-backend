import { SessionEntity } from '@lumio/modules/user-accounts/sessions/domain/entities/session.entity';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthRepository {
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
        ...(filters.deviceName && { deviceName: filters.deviceName.trim() }),
      },
    });
  }

  async updateSession(
    sessionId: number,
    iat: number,
    exp: number,
  ): Promise<SessionEntity> {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        createdAt: new Date(iat * 1000),
        expiresAt: new Date(exp * 1000),
      },
    });
  }
  async createSession(
    userId: number,
    iat: number,
    exp: number,
    deviceId: string,
    ip: string,
    deviceName: string,
  ): Promise<SessionEntity> {
    return this.prisma.session.create({
      data: {
        userId,
        deviceId,
        ip,
        deviceName: deviceName.trim(),
        createdAt: new Date(iat * 1000),
        expiresAt: new Date(exp * 1000),
      },
    });
  }

  async deleteSession(sessionId: number, userId: number): Promise<void> {
    await this.prisma.session.delete({
      where: {
        id: sessionId,
        userId,
      },
    });

    return;
  }

  async deleteAllSessionsExcludeCurrent(sessionId: number, userId: number) {
    await this.prisma.session.deleteMany({
      where: {
        id: { not: sessionId },
        userId: userId,
      },
    });

    return;
  }
}
