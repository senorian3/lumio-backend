import { Global, Module } from '@nestjs/common';
import {
  ClientsModule,
  Transport,
  MicroserviceOptions,
} from '@nestjs/microservices';
import { CoreConfig } from './core.config';

export const getRabbitmqMicroserviceOptions = (
  coreConfig: CoreConfig,
): MicroserviceOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [coreConfig.rmqUrl],
    exchange: 'sub_payments_exchange',
    exchangeOptions: {
      type: 'topic',
      durable: true,
    },
    queue: 'lumio_to_payments_queue',
    queueOptions: {
      durable: true,
      deadLetterExchange: 'dlx_payments_exchange',
      deadLetterRoutingKey: 'dlq.payments',
      messageTtl: 300000,
    },
    noAck: false,
  },
});

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'LUMIO_SERVICE',
        useFactory: (coreConfig: CoreConfig) => ({
          transport: Transport.RMQ,
          options: {
            urls: [coreConfig.rmqUrl],
            exchange: 'sub_payments_exchange',
            exchangeOptions: {
              type: 'topic',
              durable: true,
            },
            queue: 'payments_to_lumio_queue',
            queueOptions: {
              durable: true,
              deadLetterExchange: 'dlx_payments_exchange',
              deadLetterRoutingKey: 'dlq.payments',
              messageTtl: 300000,
            },
            noAck: true,
          },
        }),
        inject: [CoreConfig],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RabbitmqModule {}
