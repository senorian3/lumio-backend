import { GoogleDto } from '@lumio/modules/user-accounts/users/api/dto/transfer/google.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '@lumio/modules/user-accounts/constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { randomUUID } from 'crypto';
import { ForbiddenDomainException } from '@libs/core/exceptions/domain-exceptions';

export class LoginUserGoogleCommand {
  constructor(
    public userGoogleDto: GoogleDto,
    public deviceName: string,
    public ip: string,
  ) {}
}

@CommandHandler(LoginUserGoogleCommand)
export class LoginUserGoogleUseCase implements ICommandHandler<
  LoginUserGoogleCommand,
  { accessToken: string; refreshToken: string }
> {
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,

    private sessionRepository: SessionRepository,

    private userRepository: UserRepository,

    private cryptoService: CryptoService,
  ) {}

  async execute({
    userGoogleDto,
    deviceName,
    ip,
  }: LoginUserGoogleCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const google = await this.userRepository.findGoogleByGoogleId(
      userGoogleDto.googleId,
    );

    const existingUser = await this.userRepository.findUserByEmail(
      userGoogleDto.email,
    );

    let appUser;

    if (!existingUser && !google) {
      const isConfitmed = true;
      const newPassword = randomUUID().replace(/-/g, '').slice(0, 12);
      const passwordHash =
        await this.cryptoService.createPasswordHash(newPassword);
      appUser = await this.userRepository.createUser(
        {
          email: userGoogleDto.email,
          username: userGoogleDto.username,
          password: passwordHash,
        },
        passwordHash,
        isConfitmed,
      );

      await this.userRepository.createGoogle(userGoogleDto, appUser.id);
    } else if (google && !existingUser) {
      appUser = await this.userRepository.findUserById(google.userId);

      await this.userRepository.updateGoogle(userGoogleDto.googleId, {
        email: google.email,
        username: google.username,
      });
    } else if (existingUser && !google) {
      appUser = existingUser;

      await this.userRepository.createGoogle(userGoogleDto, existingUser.id);
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
