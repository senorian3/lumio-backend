import { NestFactory } from '@nestjs/core';
import { DynamicModule } from '@nestjs/common';
import { CoreConfig } from '@super-admin/core/core.config';
import { SuperAdminModule } from './super-admin.module';
import { SuperAdminConfigModule } from './super-admin-config.module';

export async function initAppModule(): Promise<DynamicModule> {
  const appContext = await NestFactory.createApplicationContext(
    SuperAdminConfigModule,
  );
  const coreConfig = appContext.get<CoreConfig>(CoreConfig);
  await appContext.close();

  return SuperAdminModule.forRoot(coreConfig);
}
