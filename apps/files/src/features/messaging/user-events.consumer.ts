import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { MessagingConfig } from '@libs/messaging/messaging-config';
import { PrismaService } from '@files/prisma/prisma.service';

@Injectable()
export class UserEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(
    private readonly messagingConfig: MessagingConfig,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.connectAndConsume();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async connectAndConsume() {
    try {
      const url = this.messagingConfig.rabbitmqUrl;
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(
        this.messagingConfig.rabbitmqExchanges.user,
        'topic',
        {
          durable: true,
        },
      );

      const queue = await this.channel.assertQueue('files.user.events', {
        durable: true,
      });

      await this.channel.bindQueue(
        queue.queue,
        'user.exchange',
        'user.created',
      );
      await this.channel.bindQueue(
        queue.queue,
        'user.exchange',
        'user.updated',
      );
      await this.channel.bindQueue(
        queue.queue,
        'user.exchange',
        'user.deleted',
      );

      await this.channel.consume(queue.queue, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;

            console.log(`Received message: ${routingKey}`, content);

            await this.handleMessage(routingKey, content);

            this.channel.ack(msg);
          } catch (error) {
            console.error('Error processing message:', error);
            this.channel.nack(msg, false, false);
          }
        }
      });

      console.log('UserEventsConsumer started and listening for messages');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async handleMessage(routingKey: string, content: any) {
    switch (routingKey) {
      case 'user.created':
        await this.handleUserCreated(content);
        break;
      case 'user.updated':
        await this.handleUserUpdated(content);
        break;
      case 'user.deleted':
        await this.handleUserDeleted(content);
        break;
      default:
        console.warn(`Unknown routing key: ${routingKey}`);
    }
  }

  private async handleUserCreated(content: any) {
    console.log('Handling user created event:', content);
    // Здесь можно добавить логику для создания папки пользователя или других действий
    // Например, создание записи в базе данных files для нового пользователя
  }

  private async handleUserUpdated(content: any) {
    console.log('Handling user updated event:', content);
    // Здесь можно добавить логику для обновления информации о пользователе
  }

  private async handleUserDeleted(content: any) {
    console.log('Handling user deleted event:', content);
    // Здесь можно добавить логику для удаления файлов пользователя
  }

  private async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}
