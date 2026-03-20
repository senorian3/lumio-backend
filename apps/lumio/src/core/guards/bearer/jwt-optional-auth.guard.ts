import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExternalQuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.external-query.repository';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly externalQuerySessionRepository: ExternalQuerySessionsRepository,
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
    } catch (err) {
      console.log(`OptionalJwtAuthGuard: ${err.message}`);
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

    return true;
  }

  private clearUser(request: any) {
    request.user = null;
  }
}
