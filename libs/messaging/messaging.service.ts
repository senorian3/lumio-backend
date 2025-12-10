import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { MessagingConfig } from './messaging-config';

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(private messagingConfig: MessagingConfig) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async connect() {
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
      await this.channel.assertExchange(
        this.messagingConfig.rabbitmqExchanges.file,
        'topic',
        {
          durable: true,
        },
      );

      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  private async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }

  async publishUserCreated(event: any): Promise<void> {
    await this.publish(
      this.messagingConfig.rabbitmqExchanges.user,
      'user.created',
      event,
    );
  }

  async publishUserUpdated(event: any): Promise<void> {
    await this.publish(
      this.messagingConfig.rabbitmqExchanges.user,
      'user.updated',
      event,
    );
  }

  async publishUserDeleted(event: any): Promise<void> {
    await this.publish(
      this.messagingConfig.rabbitmqExchanges.user,
      'user.deleted',
      event,
    );
  }

  async publishFileUploaded(event: any): Promise<void> {
    await this.publish(
      this.messagingConfig.rabbitmqExchanges.file,
      'file.uploaded',
      event,
    );
  }

  async publishFileDeleted(event: any): Promise<void> {
    await this.publish(
      this.messagingConfig.rabbitmqExchanges.file,
      'file.deleted',
      event,
    );
  }

  async publishAvatarUpdated(event: any): Promise<void> {
    await this.publish(
      this.messagingConfig.rabbitmqExchanges.file,
      'avatar.updated',
      event,
    );
  }

  private async publish(
    exchange: string,
    routingKey: string,
    message: any,
  ): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not available');
      }

      const buffer = Buffer.from(JSON.stringify(message));
      this.channel.publish(exchange, routingKey, buffer, { persistent: true });
    } catch (error) {
      console.error(
        `Failed to publish message to ${exchange}.${routingKey}:`,
        error,
      );
      throw error;
    }
  }
}
