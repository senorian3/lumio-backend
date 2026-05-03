import { NestFactory } from '@nestjs/core';
import { appSetup } from './app-setup';
import { CoreConfig } from '../core/core.config';
import { initAppModule } from './init-app-module';
import { AppLoggerService } from '@libs/logger/logger.service';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getRabbitmqMicroserviceOptions } from '../core/rabbitmq.module';

async function bootstrap() {
  const DynamicAppModule = await initAppModule();
  const app = await NestFactory.create(DynamicAppModule);

  const coreConfig = app.get<CoreConfig>(CoreConfig);
  app.connectMicroservice<MicroserviceOptions>(
    getRabbitmqMicroserviceOptions(coreConfig),
  );

  appSetup(app, coreConfig, DynamicAppModule);
  const port = coreConfig.port;

  const logger = app.get(AppLoggerService);

  await app.startAllMicroservices();
  await app.listen(port, () => {
    logger.log(`App starting listen port: ${port}`, bootstrap.name);
    logger.log(`NODE_ENV: ${coreConfig.env}`, bootstrap.name);
  });
}
bootstrap();
