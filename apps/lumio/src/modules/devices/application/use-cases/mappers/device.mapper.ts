import { OutputDeviceType } from '@lumio/modules/devices/dto/output';
import { SessionEntity } from '@lumio/modules/user-accounts/sessions/domain/entities/session.entity';

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
