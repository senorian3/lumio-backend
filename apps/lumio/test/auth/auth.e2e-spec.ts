import { PrismaService } from '@lumio/prisma/prisma.service';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { clearDB, initApp } from '../helpers/app.test-helper';
import { NodemailerService } from '@lumio/modules/user-accounts/adapters/nodemailer/nodemailer.service';
import request from 'supertest';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mailer: NodemailerService;

  beforeAll(async () => {
    const init = await initApp();
    app = init.app;
    prisma = init.prisma;
    mailer = app.get<NodemailerService>(NodemailerService);
  });

  beforeEach(async () => {
    await clearDB(prisma);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

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

    it('❌ should fail if username is too short', async () => {
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

    it('❌ should fail if username is too long', async () => {
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

    it('❌ should fail if username contains invalid characters', async () => {
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

    it('❌ should fail if password is too short', async () => {
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

    it('❌ should fail if password is too long', async () => {
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

    it('❌ should fail if password contains invalid characters', async () => {
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

    it('❌ should fail if email is invalid', async () => {
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

    it('❌ should fail if email is too long', async () => {
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

  describe('Auth login (e2e)', () => {
    it('✅ should register and login, returning accessToken and refreshToken cookie', async () => {
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
    it('❌ should fail login with wrong password', async () => {
      const userData = {
        username: 'RegUser12',
        password: 'StrongPass12',
        email: 'reguser12@example.com',
      };

      // сначала регистрируем пользователя
      await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send(userData)
        .expect(HttpStatus.NO_CONTENT);

      // пробуем залогиниться с неверным паролем
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
    it('❌ should fail login with non-existing email', async () => {
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
  });
});
