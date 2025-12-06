import { GitHubDto } from '../../../users/api/dto/transfer/github.dto';
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

export class LoginUserGitHubCommand {
  constructor(
    public userGithubDto: GitHubDto,
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

    private sessionRepository: SessionRepository,

    private userRepository: UserRepository,

    private cryptoService: CryptoService,
  ) {}

  async execute({
    userGithubDto,
    deviceName,
    ip,
  }: LoginUserGitHubCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const github = await this.userRepository.findGitHubByGitId(
      userGithubDto.gitId,
    );
    const existingUser = await this.userRepository.findUserByEmail(
      userGithubDto.email,
    );

    let appUser;

    if (!existingUser && !github) {
      const isConfitmed = true;
      const newPassword = randomUUID().replace(/-/g, '').slice(0, 12);
      const passwordHash =
        await this.cryptoService.createPasswordHash(newPassword);
      appUser = await this.userRepository.createUser(
        {
          email: userGithubDto.email,
          username: userGithubDto.username,
          password: passwordHash,
        },
        passwordHash,
        isConfitmed,
      );

      await this.userRepository.createGitHub({
        gitId: userGithubDto.gitId,
        email: userGithubDto.email,
        username: userGithubDto.username,
        userId: appUser.id,
      });
    } else if (github && !existingUser) {
      appUser = await this.userRepository.findUserById(github.userId);
      await this.userRepository.updateGitHub(github.id, {
        userId: appUser.id,
        email: userGithubDto.email,
        username: userGithubDto.username,
      });
    } else if (existingUser && !github) {
      appUser = existingUser;

      await this.userRepository.createGitHub({
        gitId: userGithubDto.gitId,
        email: userGithubDto.email,
        username: userGithubDto.username,
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
        'email',
      );
    }
    if (existSession) {
      const newIat = new Date(iat * 1000);
      const newExp = new Date(exp * 1000);
      await this.sessionRepository.updateSession({
        sessionId: existSession.id,
        iat: newIat,
        exp: newExp,
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
