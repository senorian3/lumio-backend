import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { SessionEntity } from '@lumio/modules/user-accounts/sessions/domain/entities/session.entity';
import { outputDevicesMapper } from '../application/use-cases/mappers/device.mapper';
import { OutputDeviceType } from '../dto/output';
@Injectable()
export class QueryDevicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllDevices(userId: number): Promise<OutputDeviceType[]> {
    const allDevices: SessionEntity[] = await this.prisma.session.findMany({
      where: { user: { id: userId } },
    });

    return allDevices.map((deviceData) => outputDevicesMapper(deviceData));
  }
}
