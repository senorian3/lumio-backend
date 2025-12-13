import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { AppModule } from '@lumio/app/app.module';
import { NodemailerService } from '@lumio/modules/user-accounts/adapters/nodemailer/nodemailer.service';
import { appSetup } from '@lumio/app/app-setup';
import { CoreConfig } from '@lumio/core/core.config';
import { NestFactory } from '@nestjs/core';
import { RecaptchaService } from '@lumio/modules/user-accounts/adapters/recaptcha.service';

export const initApp = async (): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> => {
  const tempApp = await NestFactory.createApplicationContext(AppModule);
  const coreConfig = tempApp.get<CoreConfig>(CoreConfig);
  const DynamicAppModule = await AppModule.forRoot(coreConfig);
  await tempApp.close();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [DynamicAppModule],
  })

    .overrideProvider(NodemailerService)
    .useValue({
      sendEmail: jest.fn().mockResolvedValue(undefined),
    })
    .overrideProvider(RecaptchaService)
    .useValue({
      verify: jest.fn(),
    })
    .compile();

  const app = moduleFixture.createNestApplication();

  appSetup(app, coreConfig, DynamicAppModule);

  await app.init();

  const prisma = moduleFixture.get<PrismaService>(PrismaService);

  await clearDB(prisma);

  return { app, prisma };
};

export const clearDB = async (prisma: PrismaService) => {
  const safeDeleteMany = async (deleteManyOperation: Promise<any>) => {
    try {
      await deleteManyOperation;
    } catch (error: any) {
      if (error.code === 'P2021') {
        console.warn(
          `Table not found, skipping deleteMany: ${error.meta?.table}`,
        );
      } else {
        throw error;
      }
    }
  };

  await safeDeleteMany(prisma.session.deleteMany());
  await safeDeleteMany(prisma.emailConfirmation.deleteMany());
  await safeDeleteMany(prisma.gitHub.deleteMany());
  await safeDeleteMany(prisma.google.deleteMany());
  await safeDeleteMany(prisma.post.deleteMany());
  await safeDeleteMany(prisma.user.deleteMany());
};
