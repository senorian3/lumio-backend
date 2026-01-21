import { CoreConfig } from '@payments/core/core.config';
import { PaymentsModule } from './payments.module';
import { DynamicModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

export async function initAppModule(): Promise<DynamicModule> {
  const appContext = await NestFactory.createApplicationContext(PaymentsModule);
  const coreConfig = appContext.get<CoreConfig>(CoreConfig);
  await appContext.close();

  return PaymentsModule.forRoot(coreConfig);
}
