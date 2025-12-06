import { OutputSessionType } from '../../api/dto/output/output';
import { SessionEntity } from '../../domain/session.entity';

export const outputSessionsMapper = (
  session: SessionEntity,
): OutputSessionType => {
  return {
    deviceName: session.deviceName,
    ip: session.ip,
    lastActiveDate: session.createdAt.toISOString(),
  };
};
