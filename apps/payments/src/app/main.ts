import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { initAppModule } from './init-app-module';
import { appSetup } from './app-setup';
import { CoreConfig } from '@payments/core/core.config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const DynamicAppModule = await initAppModule();

  const app = await NestFactory.create(DynamicAppModule);

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [coreConfig.rmqUrl],
      exchange: 'sub_payments_exchange',
      exchangeOptions: {
        type: 'direct',
        durable: true,
      },
      queue: 'lumio_to_payments_queue',
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
  });

  appSetup(app, coreConfig, DynamicAppModule);

  const port = coreConfig.port;

  await app.startAllMicroservices();
  await app.listen(port, () => {
    Logger.log(`Payments starting listen port: ${port}`);
    Logger.log(`NODE_ENV: ${coreConfig.env}`);
  });
}
bootstrap();
