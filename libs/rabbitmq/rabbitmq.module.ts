import { DynamicModule, Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RABBITMQ_CONFIG } from '@libs/rabbitmq/rabbitmq.constants';

@Global()
@Module({})
export class RabbitMQModule {
  static register(serviceName: 'files' | 'posts'): DynamicModule {
    return {
      module: RabbitMQModule,
      imports: [
        ClientsModule.register([
          {
            name: 'RABBITMQ_CLIENT',
            transport: Transport.RMQ,
            options: {
              urls: [RABBITMQ_CONFIG.url],
              queue: RABBITMQ_CONFIG.queues[serviceName],
              queueOptions: {
                durable: true,
              },
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
