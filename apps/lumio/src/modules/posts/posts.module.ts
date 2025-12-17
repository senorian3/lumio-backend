import { RabbitMQModule } from '@libs/rabbitmq/rabbitmq.module';
import { RabbitMQService } from '@libs/rabbitmq/rabbitmq.service';
import { Module } from '@nestjs/common';
import { PostsController } from './api/posts.controller';
import { CreatePostUseCase } from '@lumio/modules/posts/application/use-case/create-post.usecase';
import { UserAccountsModule } from '@lumio/modules/user-accounts/user-accounts.module';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { UpdatePostUseCase } from '@lumio/modules/posts/application/use-case/update-post.usecase';

@Module({
  imports: [
    RabbitMQModule.register('posts'), // Клиент для RabbitMQ
    UserAccountsModule,
  ],

  controllers: [PostsController],
  providers: [
    RabbitMQService,
    CreatePostUseCase,
    UpdatePostUseCase,
    PostRepository,
  ],
})
export class PostsModule {}
