import { SessionEntity } from 'apps/lumio/src/modules/user-accounts/sessions/domain/entities/session.entity';
import { OutputDeviceType } from '../../../dto/output';

export const outputDevicesMapper = (
  device: SessionEntity,
): OutputDeviceType => {
  return {
    deviceName: device.deviceName,
    title: device.deviceName,
    ip: device.ip,
    lastActiveDate: device.createdAt.toISOString(),
  };
};
