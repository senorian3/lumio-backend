import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { ForbiddenDomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '@lumio/modules/user-accounts/constants/auth-tokens.inject-constants';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { YandexDto } from '@lumio/modules/user-accounts/users/api/dto/transfer/yandex.dto';

export class LoginUserYandexCommand {
  constructor(
    public userYandexDto: YandexDto,
    public deviceName: string,
    public ip: string,
  ) {}
}

@CommandHandler(LoginUserYandexCommand)
export class LoginUserYandexUseCase implements ICommandHandler<
  LoginUserYandexCommand,
  { accessToken: string; refreshToken: string }
> {
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly accessTokenContext: JwtService,
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenContext: JwtService,
    private readonly sessionRepository: SessionRepository,
    private readonly userRepository: UserRepository,
    private readonly cryptoService: CryptoService,
  ) {}

  async execute({
    userYandexDto,
    deviceName,
    ip,
  }: LoginUserYandexCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const yandex = await this.userRepository.findYandexByYandexId(
      userYandexDto.yandexId,
    );
    const existingUser = await this.userRepository.findUserByEmail(
      userYandexDto.email,
    );

    let appUser;

    if (!existingUser && !yandex) {
      const isConfitmed = true;
      const newPassword = randomUUID().replace(/-/g, '').slice(0, 12);
      const passwordHash =
        await this.cryptoService.createPasswordHash(newPassword);
      appUser = await this.userRepository.createUser(
        {
          email: userYandexDto.email,
          username: userYandexDto.username,
          password: passwordHash,
        },
        passwordHash,
        isConfitmed,
      );

      await this.userRepository.createYandex({
        yandexId: userYandexDto.yandexId,
        email: userYandexDto.email,
        username: userYandexDto.username,
        userId: appUser.id,
      });
    } else if (yandex && !existingUser) {
      appUser = await this.userRepository.findUserById(yandex.userId);

      await this.userRepository.updateYandex(yandex.id, {
        userId: appUser.id,
        email: userYandexDto.email,
        username: userYandexDto.username,
      });
    } else if (existingUser && !yandex) {
      appUser = existingUser;

      await this.userRepository.createYandex({
        yandexId: userYandexDto.yandexId,
        email: userYandexDto.email,
        username: userYandexDto.username,
        userId: appUser.id,
      });
    } else {
      appUser = existingUser;
    }

    const userId = appUser.id;

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
        'Refresh token not verified',
        'refreshToken',
      );
    }
    if (existSession) {
      const newIat = new Date(iat * 1000);
      const newExp = new Date(exp * 1000);
      await this.sessionRepository.updateSession({
        sessionId: existSession.id,
        iat: newIat,
        exp: newExp,
        tokenVersion: existSession.tokenVersion + 1,
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
    const accessToken = this.accessTokenContext.sign({ userId, deviceId });

    return { accessToken, refreshToken };
  }
}
