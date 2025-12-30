import { CoreConfig } from '@files/core/core.config';
import { FilesModule } from './files.module';
import { DynamicModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

export async function initAppModule(): Promise<DynamicModule> {
  const appContext = await NestFactory.createApplicationContext(FilesModule);
  const coreConfig = appContext.get<CoreConfig>(CoreConfig);
  await appContext.close();

  return FilesModule.forRoot(coreConfig);
}
