import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { FilesModule } from './files.module';
import { Logger } from '@nestjs/common';
import { RABBITMQ_CONFIG } from '@libs/rabbitmq/rabbitmq.constants';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    FilesModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [RABBITMQ_CONFIG.url],
        queue: RABBITMQ_CONFIG.queues.files,
        queueOptions: {
          durable: true,
        },
        exchange: RABBITMQ_CONFIG.exchanges.files,
        exchangeOptions: {
          durable: true,
          type: 'direct',
        },
        routingKey: RABBITMQ_CONFIG.routingKeys.POST_CREATED,
        noAck: false,
        prefetchCount: 1,
      },
    },
  );

  await app.listen();
  Logger.log('Microservice files is listening');
}
bootstrap();
