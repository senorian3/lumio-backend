import { NestFactory } from '@nestjs/core';
import { DynamicModule } from '@nestjs/common';
import { CoreConfig } from './core/core.config';
import { FilesModule } from './files.module';

export async function initAppModule(): Promise<DynamicModule> {
  const appContext = await NestFactory.createApplicationContext(FilesModule);
  const coreConfig = appContext.get<CoreConfig>(CoreConfig);
  await appContext.close();

  return FilesModule.forRoot(coreConfig);
}
