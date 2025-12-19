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
import { DeletePostUseCase } from '@lumio/modules/posts/application/use-case/delete-post.usecase';

const useCases = [CreatePostUseCase, UpdatePostUseCase, DeletePostUseCase];

const services = [RabbitMQService];

const repository = [PostRepository];

const queryRepository = [PostQueryRepository];

@Module({
  imports: [
    RabbitMQModule.register('posts'), // Клиент для RabbitMQ
    UserAccountsModule,
  ],

  controllers: [PostsController],
  providers: [
    ...services,
    ...useCases,
    ...repository,
    ...queryRepository,
    GetCreatePostQueryHandler,
  ],
})
export class PostsModule {}
