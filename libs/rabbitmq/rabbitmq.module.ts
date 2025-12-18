import { DynamicModule, Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RABBITMQ_CONFIG } from '@libs/rabbitmq/rabbitmq.constants';

@Global()
@Module({})
export class RabbitMQModule {
  static register(serviceName: string): DynamicModule {
    return {
      module: RabbitMQModule,
      imports: [
        ClientsModule.register([
          {
            name: 'RABBITMQ_CLIENT',
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
              noAck: true,
              prefetchCount: 1,
            },
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
