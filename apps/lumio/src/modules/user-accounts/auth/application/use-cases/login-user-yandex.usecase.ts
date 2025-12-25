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

const DEFAULT_PASSWORD_LENGTH = 12;
const MILLISECONDS_IN_SECOND = 1000;

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

    const appUser = await this.determineUser(
      yandex,
      existingUser,
      userYandexDto,
    );

    const userId = appUser.id;
    const deviceId = await this.getOrCreateDeviceId(userId, deviceName);

    const { accessToken, refreshToken } = await this.createTokens(
      userId,
      deviceId,
      deviceName,
      ip,
    );

    await this.updateOrCreateSession(userId, deviceId, deviceName, ip);

    return { accessToken, refreshToken };
  }

  private async determineUser(
    yandex: any,
    existingUser: any,
    userYandexDto: YandexDto,
  ) {
    if (!existingUser && !yandex) {
      return await this.createYandexUser(userYandexDto);
    } else if (yandex && !existingUser) {
      return await this.updateExistingYandexUser(yandex, userYandexDto);
    } else if (existingUser && !yandex) {
      await this.createYandexForExistingUser(userYandexDto, existingUser.id);
      return existingUser;
    } else {
      return existingUser;
    }
  }

  private async createYandexUser(userYandexDto: YandexDto) {
    const isConfirmed = true;
    const newPassword = this.generateTemporaryPassword();
    const passwordHash =
      await this.cryptoService.createPasswordHash(newPassword);

    const newUser = await this.userRepository.createUser(
      {
        email: userYandexDto.email,
        username: userYandexDto.username,
        password: passwordHash,
      },
      passwordHash,
      isConfirmed,
    );

    await this.userRepository.createYandex({
      yandexId: userYandexDto.yandexId,
      email: userYandexDto.email,
      username: userYandexDto.username,
      userId: Number(newUser.id),
    });

    return newUser;
  }

  private async updateExistingYandexUser(
    yandex: any,
    userYandexDto: YandexDto,
  ) {
    const appUser = await this.userRepository.findUserById(yandex.userId);

    await this.userRepository.updateYandex(yandex.id, {
      userId: appUser.id,
      email: userYandexDto.email,
      username: userYandexDto.username,
    });

    return appUser;
  }

  private async createYandexForExistingUser(
    userYandexDto: YandexDto,
    userId: string,
  ) {
    await this.userRepository.createYandex({
      yandexId: userYandexDto.yandexId,
      email: userYandexDto.email,
      username: userYandexDto.username,
      userId: Number(userId),
    });
  }

  private generateTemporaryPassword(): string {
    return randomUUID().replace(/-/g, '').slice(0, DEFAULT_PASSWORD_LENGTH);
  }

  private async getOrCreateDeviceId(
    userId: string,
    deviceName: string,
  ): Promise<string> {
    const existSession = await this.sessionRepository.findSession({
      userId: Number(userId),
      deviceName,
    });

    return existSession ? existSession.deviceId : randomUUID();
  }

  private async createTokens(
    userId: string,
    deviceId: string,
    deviceName: string,
    ip: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
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

    const accessToken = this.accessTokenContext.sign({ userId, deviceId });

    return { accessToken, refreshToken };
  }

  private async updateOrCreateSession(
    userId: string,
    deviceId: string,
    deviceName: string,
    ip: string,
  ): Promise<void> {
    const existSession = await this.sessionRepository.findSession({
      userId: Number(userId),
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
        'Refresh token not verified',
        'refreshToken',
      );
    }

    const newIat = new Date(iat * MILLISECONDS_IN_SECOND);
    const newExp = new Date(exp * MILLISECONDS_IN_SECOND);

    if (existSession) {
      await this.sessionRepository.updateSession({
        sessionId: existSession.id,
        iat: newIat,
        exp: newExp,
        tokenVersion: existSession.tokenVersion + 1,
      });
    } else {
      await this.sessionRepository.createSession({
        userId: Number(userId),
        iat: newIat,
        exp: newExp,
        deviceId,
        ip,
        deviceName,
      });
    }
  }
}
