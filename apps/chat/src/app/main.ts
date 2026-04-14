import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { CoreConfig } from '@chat/core/core.config';
import { initAppModule } from './init-app-module';
import { appSetup } from './app-setup';

async function bootstrap() {
  const DynamicAppModule = await initAppModule();

  const app = await NestFactory.create(DynamicAppModule);

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  appSetup(app, coreConfig);

  const port = coreConfig.port;

  await app.listen(port, () => {
    Logger.log(`Chat starting listen port: ${port}`);
    Logger.log(`NODE_ENV: ${coreConfig.env}`);
  });
}
bootstrap();
