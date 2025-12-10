import { NestFactory } from '@nestjs/core';
import { DynamicModule } from '@nestjs/common';
import { FilesModule } from './files.module';
import { CoreConfig } from '@files/core/core.config';

export async function initAppModule(): Promise<DynamicModule> {
  const appContext = await NestFactory.createApplicationContext(FilesModule);
  const coreConfig = appContext.get<CoreConfig>(CoreConfig);
  await appContext.close();

  return FilesModule.forRoot(coreConfig);
}
