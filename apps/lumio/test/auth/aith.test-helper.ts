import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  cookies: string[];
  rawResponse: request.Response;
}

export class AuthTestHelper {
  constructor(private readonly app: INestApplication) {}

  async registerUser(
    userData: {
      username: string;
      password: string;
      email: string;
    },
    ip: string = '1', // по умолчанию '1', если не передали
  ): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .post('/api/auth/registration')
      .set('X-Forwarded-For', ip)
      .send(userData)
      .expect(HttpStatus.NO_CONTENT);
  }

  async login(
    email: string,
    password: string,
    deviceName?: string,
    ip?: string,
  ): Promise<LoginResult> {
    const payload = { email, password };

    let req = request(this.app.getHttpServer())
      .post('/api/auth/login')
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
