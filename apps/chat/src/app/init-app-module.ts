import { DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from '@chat/core/core.module';
import { PrismaModule } from '@chat/prisma/prisma.module';
import { TestingModule } from '@chat/modules/tests/testing.module';
import { CoreConfig } from '@chat/core/core.config';

export async function initAppModule(): Promise<DynamicModule> {
  const imports = [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.chat.${process.env.NODE_ENV || 'development'}`,
    }),
    CoreModule,
    PrismaModule,
  ];

  const coreConfig = new CoreConfig({
    get: (key: string) => process.env[key],
  } as any);

  if (coreConfig.includeTestingModule) {
    imports.push(TestingModule);
  }

  return {
    module: class AppModule {},
    imports,
  };
}
