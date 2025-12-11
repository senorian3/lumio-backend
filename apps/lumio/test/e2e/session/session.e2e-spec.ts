import { HttpStatus, INestApplication } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';
import request from 'supertest';
import { AuthTestHelper } from '../auth/auth.test-helper';
import { clearDB, initApp } from '../../helpers/app.test-helper';

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

    authHelper = new AuthTestHelper(app, userRepository);
  });

  beforeEach(async () => {
    await clearDB(prisma);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Security, GET api/security/devices (e2e)', () => {
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
        .get(`/${GLOBAL_PREFIX}/security/devices`)
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
        .get(`/${GLOBAL_PREFIX}/security/devices`)
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
        .get(`/${GLOBAL_PREFIX}/security/devices`)
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
        .get(`/${GLOBAL_PREFIX}/security/devices`)
        .set('X-Forwarded-For', '13')
        .set('Cookie', cookies)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Security, DELETE api/security/devices', () => {
    it('✅ Should return only current session when using refresh token', async () => {
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

      await authHelper.login(
        userData.email,
        userData.password,
        'ThirdDevice/3.0',
        '127.0.0.3',
      );

      // Проверяем что три сессии активны
      let res = await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/security/devices`)
        .set('Cookie', login1.cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);

      const deviceNames = res.body.map((d: any) => d.deviceName);
      expect(deviceNames).toEqual(
        expect.arrayContaining([
          'MyCustomAgent/1.98765',
          'AnotherDevice/2.0',
          'ThirdDevice/3.0',
        ]),
      );

      await request(app.getHttpServer())
        .delete(`/${GLOBAL_PREFIX}/security/devices`)
        .set('Cookie', login1.cookies)
        .expect(HttpStatus.NO_CONTENT);

      res = await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/security/devices`)
        .set('Cookie', login1.cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);

      const remainingDeviceNames = res.body.map((d: any) => d.deviceName);
      expect(remainingDeviceNames).toEqual(
        expect.arrayContaining(['MyCustomAgent/1.98765']),
      );
    });
    it('❌ Should fail if no refresh token cookie', async () => {
      await request(app.getHttpServer())
        .delete(`/${GLOBAL_PREFIX}/security/devices`)
        .set('X-Forwarded-For', '21')
        .expect(HttpStatus.UNAUTHORIZED);
    });
    it("❌ Should fail if user's session not found", async () => {
      const userData = {
        username: 'RegUser18',
        password: 'StrongPass18',
        email: 'reguser18@example.com',
      };

      await authHelper.registerUser(userData);

      const loginRes = await authHelper.login(
        userData.email,
        userData.password,
        'DeviceZ/1.0',
        '127.0.0.5',
      );

      const cookies = loginRes.cookies;

      const user = await userRepository.findUserByEmail(userData.email);
      await sessionRepository.deleteAllSessionsForUser(user.id);

      await request(app.getHttpServer())
        .delete(`/${GLOBAL_PREFIX}/security/devices`)
        .set('X-Forwarded-For', '22')
        .set('Cookie', cookies)
        .expect(HttpStatus.UNAUTHORIZED);
    });
    it("❌ Should fail if session payload doesn't match", async () => {
      const userData = {
        username: 'RegUser19',
        password: 'StrongPass19',
        email: 'reguser19@example.com',
      };

      await authHelper.registerUser(userData, '2');

      const loginRes = await authHelper.login(
        userData.email,
        userData.password,
        'DeviceW/2.0',
        '127.0.0.9',
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
        .delete(`/${GLOBAL_PREFIX}/security/devices`)
        .set('X-Forwarded-For', '24')
        .set('Cookie', cookies)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Security, DELETE api/security/devices/:deviceId (e2e)', () => {
    it('✅ Should delete specific device session by id', async () => {
      const userData = {
        username: 'testuser',
        password: 'StrongPass123',
        email: 'test@example.com',
      };
      await authHelper.registerUser(userData, '10');

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

      await authHelper.login(
        userData.email,
        userData.password,
        'ThirdDevice/3.0',
        '127.0.0.3',
      );

      let res = await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/security/devices`)
        .set('Cookie', login1.cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);

      const deviceNames = res.body.map((d: any) => d.deviceName);
      expect(deviceNames).toEqual(
        expect.arrayContaining([
          'MyCustomAgent/1.98765',
          'AnotherDevice/2.0',
          'ThirdDevice/3.0',
        ]),
      );

      // Берём deviceId через репозиторий
      const user = await userRepository.findUserByEmail(userData.email);
      const sessionToDelete = await sessionRepository.findSession({
        userId: user.id,
        deviceName: 'AnotherDevice/2.0',
      });

      expect(sessionToDelete).not.toBeNull();

      // Удаляем конкретное устройство по id
      await request(app.getHttpServer())
        .delete(
          `/${GLOBAL_PREFIX}/security/devices/${sessionToDelete.deviceId}`,
        )
        .set('Cookie', login1.cookies)
        .expect(HttpStatus.NO_CONTENT);

      res = await request(app.getHttpServer())
        .get(`/${GLOBAL_PREFIX}/security/devices`)
        .set('Cookie', login1.cookies)
        .expect(HttpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      const remainingDeviceNames = res.body.map((d: any) => d.deviceName);
      expect(remainingDeviceNames).toEqual(
        expect.arrayContaining(['MyCustomAgent/1.98765', 'ThirdDevice/3.0']),
      );
    });
    it('❌ Should fail if no refresh token cookie', async () => {
      await request(app.getHttpServer())
        .delete(`/${GLOBAL_PREFIX}/security/devices/123`)
        .set('X-Forwarded-For', '31')
        .expect(HttpStatus.UNAUTHORIZED);
    });
    it("❌ Should fail if user's session not found", async () => {
      const userData = {
        username: 'RegUser20',
        password: 'StrongPass20',
        email: 'reguser20@example.com',
      };

      await authHelper.registerUser(userData, '32');

      const loginRes = await authHelper.login(
        userData.email,
        userData.password,
        'DeviceA/1.0',
        '127.0.0.10',
      );

      const cookies = loginRes.cookies;

      const user = await userRepository.findUserByEmail(userData.email);
      await sessionRepository.deleteAllSessionsForUser(user.id);

      await request(app.getHttpServer())
        .delete(`/${GLOBAL_PREFIX}/security/devices/999`)
        .set('X-Forwarded-For', '33')
        .set('Cookie', cookies)
        .expect(HttpStatus.UNAUTHORIZED);
    });
    it("❌ Should fail if session payload doesn't match", async () => {
      const userData = {
        username: 'RegUser21',
        password: 'StrongPass21',
        email: 'reguser21@example.com',
      };

      await authHelper.registerUser(userData, '34');

      const loginRes = await authHelper.login(
        userData.email,
        userData.password,
        'DeviceB/2.0',
        '127.0.0.11',
      );

      const cookies = loginRes.cookies;

      const user = await userRepository.findUserByEmail(userData.email);
      const session = await sessionRepository.findSession({
        userId: user.id,
      });

      await sessionRepository.updateSession({
        sessionId: session.id,
        iat: session.createdAt,
        exp: new Date(Date.now() + 99999999),
      });

      await request(app.getHttpServer())
        .delete(`/${GLOBAL_PREFIX}/security/devices/${session.deviceId}`)
        .set('X-Forwarded-For', '35')
        .set('Cookie', cookies)
        .expect(HttpStatus.UNAUTHORIZED);
    });
    it('❌ Should fail if trying to delete current session', async () => {
      const userData = {
        username: 'RegUser22',
        password: 'StrongPass22',
        email: 'reguser22@example.com',
      };

      await authHelper.registerUser(userData, '36');

      const loginRes = await authHelper.login(
        userData.email,
        userData.password,
        'DeviceC/3.0',
        '127.0.0.12',
      );

      const cookies = loginRes.cookies;

      const user = await userRepository.findUserByEmail(userData.email);
      const currentSession = await sessionRepository.findSession({
        userId: user.id,
        deviceName: 'DeviceC/3.0',
      });

      expect(currentSession).not.toBeNull();

      await request(app.getHttpServer())
        .delete(`/${GLOBAL_PREFIX}/security/devices/${currentSession.deviceId}`)
        .set('X-Forwarded-For', '37')
        .set('Cookie', cookies)
        .expect(HttpStatus.FORBIDDEN);
    });
    it('❌ Should fail if deviceId not found', async () => {
      const userData = {
        username: 'RegUser23',
        password: 'StrongPass23',
        email: 'reguser23@example.com',
      };

      await authHelper.registerUser(userData, '38');

      const loginRes = await authHelper.login(
        userData.email,
        userData.password,
        'DeviceD/4.0',
        '127.0.0.13',
      );

      const cookies = loginRes.cookies;

      await request(app.getHttpServer())
        .delete(`/${GLOBAL_PREFIX}/security/devices/non-existent-id`)
        .set('X-Forwarded-For', '39')
        .set('Cookie', cookies)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
