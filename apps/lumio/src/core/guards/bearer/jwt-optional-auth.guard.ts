import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExternalQuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.external-query.repository';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { ForbiddenDomainException } from '@libs/core/exceptions/domain-exceptions';
import { AppLoggerService } from '@libs/logger/logger.service';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly externalQuerySessionRepository: ExternalQuerySessionsRepository,
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
    private readonly logger: AppLoggerService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      const isAuthenticated = await super.canActivate(context);

      if (!isAuthenticated) {
        this.clearUser(request);
        return true;
      }
    } catch {
      this.clearUser(request);
      return true;
    }

    const user = request.user;

    if (!user || !user.userId || !user.deviceId) {
      this.clearUser(request);
      return true;
    }

    const session =
      await this.externalQuerySessionRepository.getSessionByUserAndDeviceId(
        user.userId,
        user.deviceId,
      );

    if (!session) {
      this.clearUser(request);
      return true;
    }

    if (
      user.tokenVersion !== undefined &&
      session.tokenVersion > user.tokenVersion
    ) {
      this.clearUser(request);
      return true;
    }

    const isBlocked =
      await this.externalQueryUserAccountsRepository.isUserBlocked(user.userId);

    if (isBlocked) {
      throw ForbiddenDomainException.create(
        'User account is blocked',
        'userBlocked',
      );
    }

    return true;
  }

  private clearUser(request: any) {
    request.user = null;
  }
}
