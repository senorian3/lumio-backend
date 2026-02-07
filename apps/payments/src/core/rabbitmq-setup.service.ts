import { Injectable, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { CoreConfig } from './core.config';

@Injectable()
export class RabbitMQSetupService implements OnModuleInit {
  constructor(private readonly coreConfig: CoreConfig) {}

  async onModuleInit() {
    await this.setupBindings();
  }

  async setupBindings() {
    try {
      const rmqUrl = this.coreConfig.rmqUrl;

      const connection = await amqp.connect(rmqUrl);
      const channel = await connection.createChannel();

      // Создаем DLX exchange и очередь (если еще не созданы)
      await channel.assertExchange('dlx_payments_exchange', 'direct', {
        durable: true,
      });
      await channel.assertQueue('dlq_payments_queue', {
        durable: true,
      });
      await channel.bindQueue(
        'dlq_payments_queue',
        'dlx_payments_exchange',
        'dlq.payments',
      );

      // Убедимся, что основной exchange существует
      await channel.assertExchange('sub_payments_exchange', 'topic', {
        durable: true,
      });

      // Настроим bindings для lumio_to_payments_queue с DLX
      await channel.assertQueue('lumio_to_payments_queue', {
        durable: true,
        deadLetterExchange: 'dlx_payments_exchange',
        deadLetterRoutingKey: 'dlq.payments',
        messageTtl: 300000, // 5 минут
      });

      // Создаем binding для lumio событий
      await channel.bindQueue(
        'lumio_to_payments_queue',
        'sub_payments_exchange',
        'lumio.#',
      );

      console.log(
        'Payments RabbitMQ bindings configured successfully with DLX',
      );
      await channel.close();
      await connection.close();
    } catch (error) {
      console.error('Failed to setup RabbitMQ bindings:', error);
    }
  }
}
