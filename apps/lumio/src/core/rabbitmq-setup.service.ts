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

      await channel.assertExchange('sub_payments_exchange', 'topic', {
        durable: true,
      });

      await channel.assertQueue('payments_to_lumio_queue', {
        durable: true,
        deadLetterExchange: 'dlx_payments_exchange',
        deadLetterRoutingKey: 'dlq.payments',
        messageTtl: 300000,
      });

      await channel.bindQueue(
        'payments_to_lumio_queue',
        'sub_payments_exchange',
        'payment.#',
      );
      await channel.bindQueue(
        'payments_to_lumio_queue',
        'sub_payments_exchange',
        'subscription.#',
      );

      await channel.assertQueue('lumio_to_payments_queue', {
        durable: true,
        deadLetterExchange: 'dlx_payments_exchange',
        deadLetterRoutingKey: 'dlq.payments',
        messageTtl: 300000,
      });

      await channel.bindQueue(
        'lumio_to_payments_queue',
        'sub_payments_exchange',
        'lumio.#',
      );

      await channel.assertExchange('lumio_events', 'topic', {
        durable: true,
      });

      await channel.assertQueue('super-admin_posts_queue', {
        durable: true,
      });

      await channel.bindQueue(
        'super-admin_posts_queue',
        'lumio_events',
        'post.created',
      );

      await channel.close();
      await connection.close();
    } catch (error) {
      throw error;
    }
  }
}
