import { SessionEntity } from '@lumio/modules/user-accounts/sessions/domain/session.entity';
import { OutputSessionType } from '../../api/dto/output/output';

export const outputSessionsMapper = (
  session: SessionEntity,
): OutputSessionType => {
  return {
    deviceName: session.deviceName,
    ip: session.ip,
    lastActiveDate: session.createdAt.toISOString(),
  };
};
