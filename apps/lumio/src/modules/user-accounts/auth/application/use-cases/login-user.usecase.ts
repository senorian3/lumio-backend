import { loginDto } from '../../dto/login.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../service/auth.service';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { randomUUID } from 'crypto';
import { ForbiddenDomainException } from '../../../../../../../../libs/core/exceptions/domain-exceptions';

export class LoginUserCommand {
  constructor(
    public dto: loginDto,
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
    private accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,

    private authService: AuthService,

    private authRepository: AuthRepository,
  ) {}
  async execute({ dto, deviceName, ip }: LoginUserCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const result = await this.authService.checkUserCredentials(
      dto.email,
      dto.password,
    );

    const userId = result!.id;

    const existSession = await this.authRepository.findSession({
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
        'Refresh token not verified',
        'email',
      );
    }
    if (existSession) {
      await this.authRepository.updateSession(existSession.id, iat, exp);
    } else {
      await this.authRepository.createSession(
        userId,
        iat,
        exp,
        deviceId,
        ip,
        deviceName,
      );
    }
    const accessToken = this.accessTokenContext.sign({ userId });

    return { accessToken, refreshToken };
  }
}
