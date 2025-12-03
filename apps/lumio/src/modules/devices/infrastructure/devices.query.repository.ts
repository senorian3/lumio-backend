import { Injectable } from '@nestjs/common';
import { SessionEntity } from '../../user-accounts/sessions/domain/entities/session.entity';
import { OutputDeviceType } from '../dto/output';
import { outputDevicesMapper } from '../application/use-cases/mappers/device.mapper';
import { PrismaService } from 'apps/lumio/src/prisma/prisma.service';
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
