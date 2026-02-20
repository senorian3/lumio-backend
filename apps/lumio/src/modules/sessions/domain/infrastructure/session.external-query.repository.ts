import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { SessionEntity } from '../session.entity';
@Injectable()
export class ExternalQuerySessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSessionByUserAndDeviceId(
    userId: number,
    deviceId: string,
  ): Promise<SessionEntity> {
    return this.prisma.session.findFirst({
      where: {
        userId: userId,
        deviceId: deviceId,
        deletedAt: null,
      },
    });
  }
}
