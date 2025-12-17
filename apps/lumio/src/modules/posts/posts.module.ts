import { RabbitMQModule } from '@libs/rabbitmq/rabbitmq.module';
import { RabbitMQService } from '@libs/rabbitmq/rabbitmq.service';
import { Module } from '@nestjs/common';
import { PostsController } from './api/posts.controller';
import { CreatePostUseCase } from '@lumio/modules/posts/application/use-case/create-post.usecase';
import { UserAccountsModule } from '@lumio/modules/user-accounts/user-accounts.module';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { UpdatePostUseCase } from '@lumio/modules/posts/application/use-case/update-post.usecase';
import { GetCreatePostQueryHandler } from '@lumio/modules/posts/application/query/get-by-id-create-post.query-handler';
import { PostQueryRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';

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
    GetCreatePostQueryHandler,
    PostQueryRepository,
  ],
})
export class PostsModule {}
