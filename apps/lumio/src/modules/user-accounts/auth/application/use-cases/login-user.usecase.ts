import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { randomUUID } from 'crypto';
import { ForbiddenDomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '@lumio/modules/user-accounts/constants/auth-tokens.inject-constants';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { LoginUserTransferDto } from '@lumio/modules/user-accounts/users/api/dto/transfer/login.transfer.dto';

const MILLISECONDS_IN_SECOND = 1000;

export class LoginUserCommand {
  constructor(
    public loginDto: LoginUserTransferDto,
    public deviceName: string,
    public ip: string,
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<
  LoginUserCommand,
  { accessToken: string; refreshToken: string }
> {
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly accessTokenContext: JwtService,
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenContext: JwtService,
    private readonly authService: AuthService,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute({ loginDto, deviceName, ip }: LoginUserCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const result = await this.authService.checkUserCredentials(
      loginDto.email,
      loginDto.password,
    );

    const userId = result.id;
    const deviceId = await this.getOrCreateDeviceId(userId, deviceName);

    const refreshToken = await this.createRefreshToken(
      userId,
      deviceId,
      deviceName,
      ip,
    );

    const tokenVersion = await this.updateOrCreateSession(
      userId,
      deviceId,
      deviceName,
      ip,
    );

    const accessToken = this.createAccessToken(userId, deviceId, tokenVersion);

    return { accessToken, refreshToken };
  }

  private async getOrCreateDeviceId(
    userId: number,
    deviceName: string,
  ): Promise<string> {
    const existSession = await this.sessionRepository.findSession({
      userId,
      deviceName,
    });

    return existSession ? existSession.deviceId : randomUUID();
  }

  private async createRefreshToken(
    userId: number,
    deviceId: string,
    deviceName: string,
    ip: string,
  ): Promise<string> {
    const refreshToken = this.refreshTokenContext.sign({
      userId,
      deviceId,
      deviceName,
      ip,
    });

    const { iat, exp } = this.refreshTokenContext.verify(refreshToken);

    if (!iat || !exp) {
      throw ForbiddenDomainException.create(
        'Refresh token is not verified',
        'refreshToken',
      );
    }

    return refreshToken;
  }

  private createAccessToken(
    userId: number,
    deviceId: string,
    tokenVersion: number,
  ): string {
    return this.accessTokenContext.sign({
      userId,
      deviceId,
      tokenVersion,
    });
  }

  private async updateOrCreateSession(
    userId: number,
    deviceId: string,
    deviceName: string,
    ip: string,
  ): Promise<number> {
    const existSession = await this.sessionRepository.findSession({
      userId,
      deviceName,
    });

    const { iat, exp } = this.refreshTokenContext.verify(
      this.refreshTokenContext.sign({
        userId,
        deviceId,
        deviceName,
        ip,
      }),
    );

    if (!iat || !exp) {
      throw ForbiddenDomainException.create(
        'Refresh token is not verified',
        'refreshToken',
      );
    }

    const newIat = new Date(iat * MILLISECONDS_IN_SECOND);
    const newExp = new Date(exp * MILLISECONDS_IN_SECOND);

    let tokenVersion: number;
    if (existSession) {
      tokenVersion = existSession.tokenVersion;
      await this.sessionRepository.updateSession({
        sessionId: existSession.id,
        iat: newIat,
        exp: newExp,
        tokenVersion,
      });
    } else {
      tokenVersion = 1;
      await this.sessionRepository.createSession({
        userId,
        iat: newIat,
        exp: newExp,
        deviceId,
        ip,
        deviceName,
      });
    }

    return tokenVersion;
  }
}
