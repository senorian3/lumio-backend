import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { SessionEntity } from '../../../sessions/domain/entities/session.entity';

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
}
