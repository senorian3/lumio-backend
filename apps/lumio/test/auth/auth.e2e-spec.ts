import { PrismaService } from '@files/prisma/prisma.service';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { clearDB, initApp } from '../helper/app.test-helper';
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
        login: 'RegUser1',
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
  });
});
