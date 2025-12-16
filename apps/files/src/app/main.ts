import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { FilesModule } from './files.module';
import { Logger } from '@nestjs/common';
import { RABBITMQ_CONFIG } from '@libs/rabbitmq/rabbitmq.constants';

async function bootstrap() {
  // const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  //   FilesModule,
  //   {
  //     transport: Transport.RMQ,
  //     options: {
  //       urls: [RABBITMQ_CONFIG.url],
  //       queue: RABBITMQ_CONFIG.queues.files,
  //       queueOptions: {
  //         durable: true,
  //       },
  //       noAck: false,
  //       prefetchCount: 1,
  //     },
  //   },
  // );
  //
  // await app.listen();
  const app = await NestFactory.create(FilesModule);
  await app.listen(3003);
  Logger.log('Microservice files is listening');
}
bootstrap();
