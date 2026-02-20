import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.external-query.repository';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly externalQuerySessionRepository: ExternalQuerySessionsRepository,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId || !user.deviceId) {
      throw UnauthorizedDomainException.create(
        'Invalid user data in JWT',
        'user',
      );
    }

    const session =
      await this.externalQuerySessionRepository.getSessionByUserAndDeviceId(
        user.userId,
        user.deviceId,
      );

    if (!session) {
      throw UnauthorizedDomainException.create(
        "User doesn't have active session",
        'session',
      );
    }

    if (user.tokenVersion !== undefined) {
      if (session.tokenVersion > user.tokenVersion) {
        throw UnauthorizedDomainException.create(
          'Token version mismatch - token is invalidated',
          'tokenVersion',
        );
      }
    }

    return true;
  }
}
