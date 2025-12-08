import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { AppModule } from '@lumio/app/app.module';
import { NodemailerService } from '@lumio/modules/user-accounts/adapters/nodemailer/nodemailer.service';
import { appSetup } from '@lumio/app/settings';
import { initAppModule } from '@lumio/app/init-app-module';
import { CoreConfig } from '@lumio/core/core.config';

export const initApp = async (): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(NodemailerService)
    .useValue({
      sendEmail: jest.fn().mockResolvedValue(undefined),
    })
    .compile();

  const DynamicAppModule = await initAppModule();

  const app = moduleFixture.createNestApplication();

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  appSetup(app, coreConfig, DynamicAppModule);

  await app.init();

  const prisma = moduleFixture.get<PrismaService>(PrismaService);

  await clearDB(prisma);

  return { app, prisma };
};

export const clearDB = async (prisma: PrismaService) => {
  await prisma.$transaction([
    prisma.session.deleteMany(),
    prisma.emailConfirmation.deleteMany(),
    prisma.gitHub.deleteMany(),
    prisma.google.deleteMany(),
    prisma.post.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};
