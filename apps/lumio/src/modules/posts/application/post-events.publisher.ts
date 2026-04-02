import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { CoreConfig } from '@lumio/core/core.config';
import { AppLoggerService } from '@libs/logger/logger.service';

interface PostCreatedEvent {
  id: string;
  description: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  userId: number;
  user: {
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    isBlocked: boolean;
  };
  files: Array<{
    id: number;
    url: string;
    postId: string;
    createdAt: Date;
    deletedAt: Date | null;
  }>;
}

@Injectable()
export class PostEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(
    private readonly coreConfig: CoreConfig,
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit() {
    try {
      this.connection = await amqp.connect(this.coreConfig.rmqUrl);
      this.channel = await this.connection.createChannel();
    } catch (error) {
      this.logger.error(
        `Failed to connect to RabbitMQ: ${error.message}`,
        error.stack,
        PostEventsPublisher.name,
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (error) {
      this.logger.error(
        `Failed to disconnect from RabbitMQ: ${error.message}`,
        error.stack,
        PostEventsPublisher.name,
      );
    }
  }

  async publishPostCreated(postData: PostCreatedEvent): Promise<void> {
    if (!this.channel) {
      return;
    }

    try {
      const message = Buffer.from(JSON.stringify(postData));
      await this.channel.assertExchange('lumio_events', 'topic', {
        durable: true,
      });
      this.channel.publish('lumio_events', 'post.created', message);
    } catch (error) {
      this.logger.error(
        `Failed to publish post.created event: ${error.message}`,
        error.stack,
        PostEventsPublisher.name,
      );
    }
  }
}
