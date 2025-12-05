import { SessionEntity } from '@lumio/modules/user-accounts/sessions/api/models/session.entity';
import { OutputSessionType } from '../../api/models/dto/output/output';

export const outputSessionsMapper = (
  session: SessionEntity,
): OutputSessionType => {
  return {
    deviceName: session.deviceName,
    title: session.deviceName,
    ip: session.ip,
    lastActiveDate: session.createdAt.toISOString(),
  };
};
