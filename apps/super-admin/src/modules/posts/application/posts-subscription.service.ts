import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { PubSub } from 'graphql-subscriptions';
import { CoreConfig } from '@super-admin/core/core.config';
import { PostCreatedSubscription } from '../domain/schema/post/post-created-subscription.schema';

@Injectable()
export class PostsSubscriptionService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  public readonly pubSub: PubSub = new PubSub();
  private readonly logger = new Logger(PostsSubscriptionService.name);

  constructor(private readonly coreConfig: CoreConfig) {}

  async onModuleInit() {
    setTimeout(() => this.connectToRabbitMQ(), 1000);
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
        setTimeout(() => this.connectToRabbitMQ(), 5000);
      });

      this.channel = await this.connection.createChannel();

      this.channel.on('error', (error) => {
        this.logger.error(`RabbitMQ channel error: ${error.message}`);
      });

      this.channel.on('close', () => {
        this.channel = null;
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
      setTimeout(() => this.connectToRabbitMQ(), 5000);
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('PostsSubscriptionService disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error(
        `Failed to disconnect from RabbitMQ: ${error.message}`,
        error.stack,
      );
    }
  }
}
