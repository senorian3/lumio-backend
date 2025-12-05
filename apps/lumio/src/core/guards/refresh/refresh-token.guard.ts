import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';
import { Request } from 'express';
import { AuthRepository } from '@lumio/modules/user-accounts/sessions/infrastructure/session.repository';
import { UserAccountsConfig } from '@lumio/modules/user-accounts/config/user-accounts.config';
import { SessionEntity } from '@lumio/modules/user-accounts/sessions/api/models/session.entity';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userAccountsConfig: UserAccountsConfig,
    private readonly authRepository: AuthRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      throw UnauthorizedDomainException.create(
        'There is no refresh token in request',
      );
    }

    const payload = this.jwtService.verify(refreshToken, {
      secret: this.userAccountsConfig.refreshTokenSecret,
    });

    const session: SessionEntity | null = await this.authRepository.findSession(
      payload.deviceId,
    );

    if (!session) {
      throw UnauthorizedDomainException.create("User doesn't have session");
    }

    const exp: Date = new Date(payload.exp * 1000);

    if (session.userId !== payload.userId || session.expiresAt !== exp) {
      throw UnauthorizedDomainException.create("User doesn't have session");
    }

    if (payload.tokenVersion !== session.tokenVersion) {
      throw UnauthorizedDomainException.create('Token version mismatch');
    }

    request.user = payload;

    return true;
  }
}
