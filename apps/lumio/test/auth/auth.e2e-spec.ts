import { PrismaService } from '@lumio/prisma/prisma.service';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { clearDB, initApp } from '../helpers/app.test-helper';
import { NodemailerService } from '@lumio/modules/user-accounts/adapters/nodemailer/nodemailer.service';
import request from 'supertest';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { RecaptchaService } from '@lumio/modules/user-accounts/adapters/recaptcha.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mailer: NodemailerService;
  let sessionRepository: SessionRepository;
  let userRepository: UserRepository;
  let recaptchaService: RecaptchaService;

  beforeAll(async () => {
    const init = await initApp();
    app = init.app;
    prisma = init.prisma;
    mailer = app.get<NodemailerService>(NodemailerService);

    userRepository = app.get<UserRepository>(UserRepository);
    sessionRepository = app.get<SessionRepository>(SessionRepository);
    recaptchaService = app.get(RecaptchaService);
  });

  beforeEach(async () => {
    await clearDB(prisma);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  //тут нету тестов на тротлер (429)
  describe('Auth registration (e2e)', () => {
    it('✅ Should register user and send confirmation email', async () => {
      const userData = {
        username: 'RegUser1',
        password: 'StrongPass1',
        email: 'reguser1@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      expect(mailer.sendEmail).toHaveBeenCalledTimes(1);
      expect(mailer.sendEmail).toHaveBeenCalledWith(
        userData.email,
        expect.any(String),
        expect.any(Function),
      );
    });
    it('❌ Should return BAD_REQUEST when trying to register with duplicate username or email', async () => {
      const userData = {
        username: 'RegUser1',
        password: 'StrongPass1',
        email: 'reguser1@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      const badResponseUserName = await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send({ ...userData, email: 'reguser_test@example.com' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(badResponseUserName.body).toEqual({
        errorsMessages: [
          {
            message: 'User with this username is already registered',
            field: 'username',
          },
        ],
      });

      const badResponseEmail = await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send({ ...userData, username: 'TestUserName' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(badResponseEmail.body).toEqual({
        errorsMessages: [
          {
            message: 'User with this email is already registered',
            field: 'email',
          },
        ],
      });
    });
    it('❌ Should fail if username is too short', async () => {
      const userData = {
        username: 'abc', // меньше 6 символов
        password: 'ValidPass123',
        email: 'shortuser@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('❌ Should fail if username is too long', async () => {
      const userData = {
        username: 'A'.repeat(35), // больше 30 символов
        password: 'ValidPass123',
        email: 'longuser@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('❌ Should fail if username contains invalid characters', async () => {
      const userData = {
        username: 'Invalid@User!', // недопустимые символы
        password: 'ValidPass123',
        email: 'invaliduser@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('❌ Should fail if password is too short', async () => {
      const userData = {
        username: 'ValidUser123',
        password: '123', // меньше 6 символов
        email: 'shortpass@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('❌ Should fail if password is too long', async () => {
      const userData = {
        username: 'ValidUser123',
        password: 'A'.repeat(25), // больше 20 символов
        email: 'longpass@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('❌ Should fail if password contains invalid characters', async () => {
      const userData = {
        username: 'ValidUser123',
        password: 'Pass@@123', // недопустимые символы
        email: 'invalidpass@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('❌ Should fail if email is invalid', async () => {
      const userData = {
        username: 'ValidUser123',
        password: 'ValidPass123',
        email: 'invalid-email', // невалидный email
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('❌ Should fail if email is too long', async () => {
      const userData = {
        username: 'ValidUser123',
        password: 'ValidPass123',
        email: `${'a'.repeat(95)}@example.com`, // больше 100 символов
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  //тут нету тестов на тротлер (429)
  describe('Auth login (e2e)', () => {
    it('✅ Should register and login, returning accessToken and refreshToken cookie', async () => {
      const userData = {
        username: 'RegUser11',
        password: 'StrongPass11',
        email: 'reguser11@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(HttpStatus.OK);

      expect(loginResponse.body).toMatchObject({
        accessToken: expect.any(String),
      });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=.*HttpOnly/);
    });
    it('❌ Should fail login with wrong password', async () => {
      const userData = {
        username: 'RegUser12',
        password: 'StrongPass12',
        email: 'reguser12@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      const badLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'WrongPass12',
        })
        .expect(HttpStatus.FORBIDDEN);

      expect(badLoginResponse.body).toEqual({
        errorsMessages: [
          {
            message: 'The email must match the format example@example.com',
            field: 'email',
          },
        ],
      });
    });
    it('❌ Should fail login with non-existing email', async () => {
      const badLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'SomePass123',
        })
        .expect(HttpStatus.FORBIDDEN);

      expect(badLoginResponse.body).toEqual({
        errorsMessages: [
          {
            message: 'The email must match the format example@example.com',
            field: 'email',
          },
        ],
      });
    });
    it('❌ Should fail login with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'SomePass123',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
    it('❌ Should fail login with empty password', async () => {
      const userData = {
        username: 'RegUser13',
        password: 'StrongPass13',
        email: 'reguser13@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: '',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  //тут нету тестов на тротлер (429)
  describe('Auth Logout (e2e)', () => {
    it('✅ Should be able to logout', async () => {
      const userData = {
        username: 'RegUser13',
        password: 'StrongPass13',
        email: 'reguser13@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(userData)
        .expect(HttpStatus.OK);

      const cookies = loginRes.headers['set-cookie'];

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', cookies)
        .expect(HttpStatus.NO_CONTENT);
    });
    it('❌ Should fail if no refresh token cookie', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(HttpStatus.UNAUTHORIZED);
    });
    it("❌ Should fail if user's session not found", async () => {
      const userData = {
        username: 'RegUser14',
        password: 'StrongPass14',
        email: 'reguser14@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(userData)
        .expect(HttpStatus.OK);

      const cookies = loginRes.headers['set-cookie'];

      const user = await userRepository.findUserByEmail(userData.email);
      await sessionRepository.deleteAllSessionsForUser(user.id);

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', cookies)
        .expect(HttpStatus.UNAUTHORIZED);
    });
    it("❌ Should fail if session payload doesn't match", async () => {
      const userData = {
        username: 'RegUser15',
        password: 'StrongPass15',
        email: 'reguser15@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(userData)
        .expect(HttpStatus.OK);

      const cookies = loginRes.headers['set-cookie'];

      const user = await userRepository.findUserByEmail(userData.email);
      const session = await sessionRepository.findSession({ userId: user.id });
      await sessionRepository.updateSession({
        sessionId: session.id,
        iat: session.createdAt,
        exp: new Date(Date.now() + 99999999),
      });

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', cookies)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  //тут нету тестов на тротлер (429)
  describe('Auth new password (e2e)', () => {
    it('✅ Should return 204 and send recovery email if email exists', async () => {
      const userData = {
        username: 'RegUser13',
        password: 'StrongPass13',
        email: 'reguser13@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      const user = await userRepository.findUserByEmail(userData.email);
      const emailConfiguration =
        await userRepository.findByCodeOrIdEmailConfirmation({
          userId: user.id,
        });
      const recoveryCode = emailConfiguration.confirmationCode;

      const newPassword = 'StrongPass123';

      await request(app.getHttpServer())
        .post('/api/auth/new-password')
        .send({ recoveryCode, newPassword })
        .expect(HttpStatus.NO_CONTENT);
    });
    it('❌ Should fail with 400 if recoveryCode is invalid', async () => {
      const userData = {
        username: 'RegUser14',
        password: 'StrongPass14',
        email: 'reguser14@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      const invalidRecoveryCode = 'non-existent-code-123';
      const newPassword = 'StrongPass123';

      const response = await request(app.getHttpServer())
        .post('/api/auth/new-password')
        .send({ recoveryCode: invalidRecoveryCode, newPassword })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        errorsMessages: [
          {
            message: 'User does not exist',
            field: 'code',
          },
        ],
      });
    });
  });

  //тут нету тестов на тротлер (429)
  describe('Auth Password Recovery (e2e)', () => {
    it('✅ Should return 204 and send recovery email if reCAPTCHA valid', async () => {
      (recaptchaService.verify as jest.Mock).mockResolvedValue(true);

      const userData = {
        username: 'RecaptchaUser1',
        password: 'StrongPass123',
        email: 'example@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({
          email: userData.email,
          recaptchaToken: '6LfsdsdSSEsAAAAALfsdfDmlRycmKgdsfgAlcxKEp2w1Vm',
        })
        .expect(HttpStatus.NO_CONTENT);

      expect(mailer.sendEmail).toHaveBeenCalled();
    });
    it('❌ Should fail with 403 if reCAPTCHA invalid', async () => {
      (recaptchaService.verify as jest.Mock).mockResolvedValue(false);

      const userData = {
        username: 'RecaptchaUser2',
        password: 'StrongPass123',
        email: 'example@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({
          email: userData.email,
          recaptchaToken: 'invalid-token',
        })
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body).toEqual({
        errorsMessages: [
          {
            message: 'reCAPTCHA verification failed',
            field: 'recaptchaToken',
          },
        ],
      });
    });
    it('❌ Should fail with 403 if user does not exist', async () => {
      (recaptchaService.verify as jest.Mock).mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({
          email: 'nonexistent@example.com',
          recaptchaToken: 'valid-token',
        })
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body).toEqual({
        errorsMessages: [
          {
            message: 'User does not exist',
            field: 'email',
          },
        ],
      });

      expect(mailer.sendEmail).not.toHaveBeenCalled();
    });
    it('❌ Should fail with 400 if recaptchaToken is missing', async () => {
      const userData = {
        username: 'RecaptchaUser3',
        password: 'StrongPass123',
        email: 'dto-missing@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({
          email: userData.email,
          // recaptchaToken intentionally omitted
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        errorsMessages: [
          {
            message:
              'recaptchaToken must be a string; Received value: undefined',
            field: 'recaptchaToken',
          },
        ],
      });
    });
    it('❌ Should fail with 400 if recaptchaToken is not a string', async () => {
      const userData = {
        username: 'RecaptchaUser4',
        password: 'StrongPass123',
        email: 'dto-invalid@example.com',
      };

      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      const response = await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({
          email: userData.email,
          recaptchaToken: 12345,
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        errorsMessages: [
          {
            message: 'recaptchaToken must be a string; Received value: 12345',
            field: 'recaptchaToken',
          },
        ],
      });
    });
    it('❌ Should fail with 400 if email is too short (< 6 chars)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({
          email: 'a@b.c',
          recaptchaToken: 'valid-token',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        errorsMessages: [
          {
            field: 'email',
            message: expect.stringContaining('Minimum number of characters 6'),
          },
        ],
      });
    });
    it('❌ Should fail with 400 if email is too long (> 100 chars)', async () => {
      const longEmail = 'a'.repeat(95) + '@example.com'; // длина > 100 символов

      await request(app.getHttpServer())
        .post('/api/auth/password-recovery')
        .send({
          email: longEmail,
          recaptchaToken: 'valid-token',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
