import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { OutputDeviceType } from '../../dto/output';
import { QueryDevicesRepository } from '../../infrastructure/devices.query.repository';

export class GetAllDevicesCommand {
  constructor(public userId: number) {}
}

@QueryHandler(GetAllDevicesCommand)
export class GetAllDevicesUseCase
  implements IQueryHandler<GetAllDevicesCommand>
{
  constructor(
    private readonly queryDevicesRepository: QueryDevicesRepository,
  ) {}

  async execute({ userId }: GetAllDevicesCommand): Promise<OutputDeviceType[]> {
    const allDevices: OutputDeviceType[] =
      await this.queryDevicesRepository.getAllDevices(userId);

    if (!allDevices) {
      throw BadRequestDomainException.create('Cant get all devices');
    }

    return allDevices;
  }
}
