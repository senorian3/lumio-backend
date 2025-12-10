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
import { loginDto } from '../../../users/api/dto/transfer/login.dto';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';

export class LoginUserCommand {
  constructor(
    public loginDto: loginDto,
    public deviceName: string,
    public ip: string,
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase
  implements
    ICommandHandler<
      LoginUserCommand,
      { accessToken: string; refreshToken: string }
    >
{
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

    const existSession = await this.sessionRepository.findSession({
      userId,
      deviceName: deviceName,
    });

    let deviceId: string;

    if (existSession) {
      deviceId = existSession.deviceId;
    } else {
      deviceId = randomUUID();
    }

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
    if (existSession) {
      await this.sessionRepository.updateSession({
        sessionId: existSession.id,
        iat: new Date(iat * 1000),
        exp: new Date(exp * 1000),
      });
    } else {
      await this.sessionRepository.createSession({
        userId,
        iat: new Date(iat * 1000),
        exp: new Date(exp * 1000),
        deviceId,
        ip,
        deviceName,
      });
    }
    const accessToken = this.accessTokenContext.sign({ userId });

    return { accessToken, refreshToken };
  }
}
