import { NestFactory } from '@nestjs/core';
import { CoreConfig } from '@chat/core/core.config';
import { initAppModule } from './init-app-module';
import { appSetup } from './app-setup';
import { AppLoggerService } from '@libs/logger/logger.service';

async function bootstrap() {
  const DynamicAppModule = await initAppModule();

  const app = await NestFactory.create(DynamicAppModule, {
    bufferLogs: true,
  });

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  appSetup(app, coreConfig, DynamicAppModule);

  const port = coreConfig.port;

  const logger = app.get(AppLoggerService);

  await app.listen(port, () => {
    logger.log(`Chat starting listen port: ${port}`, bootstrap.name);
    logger.log(`NODE_ENV: ${coreConfig.env}`, bootstrap.name);
  });
}
bootstrap();
