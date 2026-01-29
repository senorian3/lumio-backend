import { NestFactory } from '@nestjs/core';
import { appSetup } from './app-setup';
import { CoreConfig } from '../core/core.config';
import { initAppModule } from './init-app-module';
import { AppLoggerService } from '@libs/logger/logger.service';
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
      queue: 'payments_to_lumio_queue',
      queueOptions: {
        durable: true,
        deadLetterExchange: 'dlx_ack_exchange',
        deadLetterRoutingKey: 'dlq.acknowledgment',
        messageTtl: 300000,
      },
      noAck: true,
    },
  });

  appSetup(app, coreConfig, DynamicAppModule);
  const port = coreConfig.port;

  const logger = new AppLoggerService();

  await app.startAllMicroservices();
  await app.listen(port, () => {
    logger.log(`App starting listen port: ${port}`, bootstrap.name);
    logger.log(`NODE_ENV: ${coreConfig.env}`, bootstrap.name);
  });
}
bootstrap();
