import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, UnauthorizedException } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '@lumio/modules/user-accounts/constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';

export class RefreshTokenCommand {
  constructor(
    public deviceName: string,
    public ip: string,
    public userId: number,
    public deviceId: string,
  ) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCase implements ICommandHandler<
  RefreshTokenCommand,
  { accessToken: string; refreshToken: string }
> {
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly accessTokenContext: JwtService,
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenContext: JwtService,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute({
    deviceName,
    ip,
    userId,
    deviceId,
  }: RefreshTokenCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const sessionExists = await this.sessionRepository.findSession({
      deviceId: deviceId,
    });

    const refreshToken = this.refreshTokenContext.sign({
      userId: userId,
      deviceId: deviceId,
      deviceName: deviceName,
      ip: ip,
    });

    const refreshTokenVerify = this.refreshTokenContext.verify(refreshToken);

    if (!refreshTokenVerify) {
      throw new UnauthorizedException(
        'There is no such session',
        'InvalidRefreshToken',
      );
    }

    await this.sessionRepository.updateSession({
      sessionId: sessionExists.id,
      iat: new Date(refreshTokenVerify.iat * 1000),
      exp: new Date(refreshTokenVerify.exp * 1000),
      tokenVersion: sessionExists.tokenVersion + 1,
    });

    const accessToken = this.accessTokenContext.sign({ userId, deviceId });
    return { accessToken, refreshToken };
  }
}
