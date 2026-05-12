import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { initAppModule } from './init-app-module';
import { appSetup } from './app-setup';
import { CoreConfig } from '@payments/core/core.config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getRabbitmqMicroserviceOptions } from '@payments/core/rabbitmq.module';

async function bootstrap() {
  const DynamicAppModule = await initAppModule();

  const app = await NestFactory.create(DynamicAppModule, {
    rawBody: true,
  });

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  app.connectMicroservice<MicroserviceOptions>(
    getRabbitmqMicroserviceOptions(coreConfig),
  );

  appSetup(app, coreConfig, DynamicAppModule);

  const port = coreConfig.port;

  await app.startAllMicroservices();
  await app.listen(port, () => {
    Logger.log(`Payments starting listen port: ${port}`);
    Logger.log(`NODE_ENV: ${coreConfig.env}`);
  });
}
bootstrap();
