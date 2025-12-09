import { HttpStatus, INestApplication } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { clearDB, initApp } from '../helpers/app.test-helper';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';

import request from 'supertest';
import { AuthTestHelper } from '../auth/aith.test-helper';

describe('Session (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let sessionRepository: SessionRepository;
  let userRepository: UserRepository;

  let authHelper: AuthTestHelper;

  beforeAll(async () => {
    const init = await initApp();
    app = init.app;
    prisma = init.prisma;

    userRepository = app.get<UserRepository>(UserRepository);
    sessionRepository = app.get<SessionRepository>(SessionRepository);

    authHelper = new AuthTestHelper(app);
  });

  beforeEach(async () => {
    await clearDB(prisma);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Security, Get api/security/devices (e2e)', () => {
    it('✅ Should return all active sessions with correct deviceName and ip', async () => {
      const userData = {
        username: 'testuser',
        password: 'StrongPass123',
        email: 'test@example.com',
      };
      await authHelper.registerUser(userData);

      const login1 = await authHelper.login(
        userData.email,
        userData.password,
        'MyCustomAgent/1.98765',
        '127.0.0.1',
      );

      await authHelper.login(
        userData.email,
        userData.password,
        'AnotherDevice/2.0',
        '127.0.0.2',
      );

      const res = await request(app.getHttpServer())
        .get('/api/security/devices')
        .set('Cookie', login1.cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      const deviceNames = res.body.map((d: any) => d.deviceName);

      expect(deviceNames).toEqual(
        expect.arrayContaining(['MyCustomAgent/1.98765', 'AnotherDevice/2.0']),
      );
    });

    it('❌ Should fail if no refresh token cookie', async () => {
      await request(app.getHttpServer())
        .get('/api/security/devices')
        .set('X-Forwarded-For', '11')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("❌ Should fail if user's session not found", async () => {
      const userData = {
        username: 'RegUser16',
        password: 'StrongPass16',
        email: 'reguser16@example.com',
      };

      await authHelper.registerUser(userData);

      const loginRes = await authHelper.login(
        userData.email,
        userData.password,
        'DeviceX/1.0',
        '127.0.0.3',
      );

      const cookies = loginRes.cookies;

      const user = await userRepository.findUserByEmail(userData.email);
      await sessionRepository.deleteAllSessionsForUser(user.id);

      await request(app.getHttpServer())
        .get('/api/security/devices')
        .set('X-Forwarded-For', '12')
        .set('Cookie', cookies)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("❌ Should fail if session payload doesn't match", async () => {
      const userData = {
        username: 'RegUser17',
        password: 'StrongPass17',
        email: 'reguser17@example.com',
      };

      await authHelper.registerUser(userData);

      const loginRes = await authHelper.login(
        userData.email,
        userData.password,
        'DeviceY/2.0',
        '127.0.0.4',
      );

      const cookies = loginRes.cookies;

      const user = await userRepository.findUserByEmail(userData.email);
      const session = await sessionRepository.findSession({ userId: user.id });
      await sessionRepository.updateSession({
        sessionId: session.id,
        iat: session.createdAt,
        exp: new Date(Date.now() + 99999999),
      });

      await request(app.getHttpServer())
        .get('/api/security/devices')
        .set('X-Forwarded-For', '13')
        .set('Cookie', cookies)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
