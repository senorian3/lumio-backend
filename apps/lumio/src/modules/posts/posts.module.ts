import { RabbitMQModule } from '@libs/rabbitmq/rabbitmq.module';
import { RabbitMQService } from '@libs/rabbitmq/rabbitmq.service';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { Module } from '@nestjs/common';
import { PostsController } from './api/posts.controller';

@Module({
  imports: [
    RabbitMQModule.register('posts'), // Клиент для RabbitMQ
  ],

  controllers: [PostsController],
  providers: [RabbitMQService],
})
export class PostsModule {}
