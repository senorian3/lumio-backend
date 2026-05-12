import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { PubSub } from 'graphql-subscriptions';
import { CoreConfig } from '@super-admin/core/core.config';
import { PostCreatedSubscription } from '../domain/schema/post/post-created-subscription.schema';
import { AppLoggerService } from '@libs/logger/logger.service';

@Injectable()
export class PostsSubscriptionService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  public readonly pubSub: PubSub = new PubSub();

  constructor(
    private readonly coreConfig: CoreConfig,
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit() {
    await this.connectToRabbitMQ();
  }

  private async connectToRabbitMQ(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.coreConfig.rmqUrl);

      this.connection.on('error', (error) => {
        this.logger.error(`RabbitMQ connection error: ${error.message}`);
      });

      this.connection.on('close', () => {
        this.logger.warn(
          'RabbitMQ connection closed, attempting to reconnect...',
        );
        this.channel = null;
      });

      this.channel = await this.connection.createChannel();

      this.channel.on('error', (error) => {
        this.logger.error(`RabbitMQ channel error: ${error.message}`);
      });

      this.channel.on('close', () => {
        this.channel = null;
      });

      await this.channel.assertExchange('lumio_events', 'topic', {
        durable: true,
      });
      await this.channel.assertQueue('super-admin_posts_queue', {
        durable: true,
      });
      await this.channel.bindQueue(
        'super-admin_posts_queue',
        'lumio_events',
        'post.created',
      );

      this.channel.consume('super-admin_posts_queue', async (msg) => {
        if (msg) {
          try {
            const rawData = JSON.parse(msg.content.toString());

            const postData: PostCreatedSubscription = {
              id: rawData.id,
              description: rawData.description,
              createdAt: new Date(rawData.createdAt),
              deletedAt: rawData.deletedAt ? new Date(rawData.deletedAt) : null,
              user: {
                id: rawData.user.id,
              },
              files: rawData.files.map((file: any) => ({
                id: file.id,
                url: file.url,
                createdAt: new Date(file.createdAt),
              })),
            };

            await this.pubSub.publish('postCreated', {
              postCreated: postData,
            });

            this.channel.ack(msg);
          } catch (error) {
            this.logger.error(
              `Failed to process post.created event: ${error.message}`,
              error.stack,
            );
            this.channel.nack(msg, false, false);
          }
        }
      });
    } catch (error) {
      this.logger.warn(
        `Failed to connect to RabbitMQ: ${error.message}. Retrying in 5 seconds...`,
      );
      this.channel = null;
      this.connection = null;
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
      );
    }
  }
}
