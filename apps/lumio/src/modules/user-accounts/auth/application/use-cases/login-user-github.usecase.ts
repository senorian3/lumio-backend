import { GitHubDto } from '../../dto/github.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { UserRepository } from '../../../users/infrastructure/repositories/user.repository';
import { CryptoService } from '../../../adapters/crypto.service';
import { randomUUID } from 'crypto';
import { ForbiddenDomainException } from '../../../../../../../../libs/core/exceptions/domain-exceptions';

export class LoginUserGitHubCommand {
  constructor(
    public user: GitHubDto,
    public deviceName: string,
    public ip: string,
  ) {}
}

@CommandHandler(LoginUserGitHubCommand)
export class LoginUserGitHubUseCase
  implements
    ICommandHandler<
      LoginUserGitHubCommand,
      { accessToken: string; refreshToken: string }
    >
{
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,

    private authRepository: AuthRepository,

    private userRepository: UserRepository,

    private cryptoService: CryptoService,
  ) {}

  async execute({ user, deviceName, ip }: LoginUserGitHubCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const github = await this.userRepository.findGitHubByGitId(user.gitId);
    const existingUser = await this.userRepository.findUserByEmail(user.email);
    let appUser;

    if (!existingUser && !github) {
      const isConfitmed = true;
      const newPassword = randomUUID().replace(/-/g, '').slice(0, 12);
      const passwordHash =
        await this.cryptoService.createPasswordHash(newPassword);
      appUser = await this.userRepository.createUser(
        {
          email: user.email,
          username: user.username,
          password: passwordHash,
        },
        passwordHash,
        isConfitmed,
      );

      await this.userRepository.createGitHub({
        gitId: user.gitId,
        email: user.email,
        username: user.username,
        userId: appUser.id,
      });
    } else if (github && !existingUser) {
      appUser = await this.userRepository.findUserById(github.userId);
      await this.userRepository.updateGitHub(github.id, {
        userId: appUser.id,
        email: user.email,
        username: user.username,
      });
    } else if (existingUser && !github) {
      appUser = existingUser;

      await this.userRepository.createGitHub({
        gitId: user.gitId,
        email: user.email,
        username: user.username,
        userId: appUser.id,
      });
    } else {
      appUser = existingUser;
    }

    const userId = appUser.id;

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
