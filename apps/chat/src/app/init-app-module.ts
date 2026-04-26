import { CoreConfig } from '@chat/core/core.config';
import { ChatModule } from './chat.module';
import { DynamicModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

export async function initAppModule(): Promise<DynamicModule> {
  const appContext = await NestFactory.createApplicationContext(ChatModule);
  const coreConfig = appContext.get<CoreConfig>(CoreConfig);
  await appContext.close();

  return ChatModule.forRoot(coreConfig);
}
