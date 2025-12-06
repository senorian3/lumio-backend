import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';
import { Request } from 'express';
import { UserAccountsConfig } from '@lumio/modules/user-accounts/config/user-accounts.config';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userAccountsConfig: UserAccountsConfig,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      throw UnauthorizedDomainException.create(
        'There is no refresh token in request',
        'refreshToken',
      );
    }

    const payload = this.jwtService.verify(refreshToken, {
      secret: this.userAccountsConfig.refreshTokenSecret,
    });

    const session: SessionEntity | null =
      await this.sessionRepository.findSession(payload.deviceId);

    if (!session) {
      throw UnauthorizedDomainException.create(
        "User doesn't have session",
        'deviceId',
      );
    }

    const exp: Date = new Date(payload.exp * 1000);

    if (session.userId !== payload.userId || session.expiresAt !== exp) {
      throw UnauthorizedDomainException.create(
        "User doesn't have session",
        'session',
      );
    }

    request.user = payload;

    return true;
  }
}
