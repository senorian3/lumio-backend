import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  cookies: string[];
  rawResponse: request.Response;
}

export class AuthTestHelper {
  constructor(
    private readonly app: INestApplication,
    private readonly userRepository: UserRepository,
  ) {}

  async registerUser(
    userData: {
      username: string;
      password: string;
      email: string;
    },
    ip: string = '1',
  ): Promise<{ user: UserEntity; confirmCode: string }> {
    await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .set('X-Forwarded-For', ip)
      .send(userData)
      .expect(HttpStatus.NO_CONTENT);

    const user = await this.userRepository.findUserByEmail(userData.email);
    const emailConfirmation =
      await this.userRepository.findByCodeOrIdEmailConfirmation({
        userId: user.id,
      });

    const confirmCode = emailConfirmation.confirmationCode;

    await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
      .send({ confirmCode })
      .expect(HttpStatus.NO_CONTENT);

    return { user, confirmCode };
  }

  async login(
    email: string,
    password: string,
    deviceName?: string,
    ip?: string,
  ): Promise<LoginResult> {
    const payload = { email, password };

    let req = request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send(payload);

    if (deviceName) {
      req = req.set('User-Agent', deviceName);
    }

    if (ip) {
      req = req.set('X-Forwarded-For', ip);
    }

    const res = await req.expect(HttpStatus.OK);

    const accessToken: string = res.body?.accessToken;
    const cookiesRaw = res.headers['set-cookie'];
    const cookies = Array.isArray(cookiesRaw) ? cookiesRaw : [cookiesRaw];
    const refreshTokenCookie = cookies.find((c) =>
      c.startsWith('refreshToken='),
    );

    const refreshToken = refreshTokenCookie
      ? refreshTokenCookie.split(';')[0].replace('refreshToken=', '')
      : '';

    return {
      accessToken,
      refreshToken,
      cookies,
      rawResponse: res,
    };
  }

  async registerAndLogin(userData: {
    username: string;
    password: string;
    email: string;
  }): Promise<LoginResult> {
    await this.registerUser(userData);
    return this.login(userData.email, userData.password);
  }
}
