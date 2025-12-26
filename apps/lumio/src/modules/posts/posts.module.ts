import { Module } from '@nestjs/common';
import { PostsController } from './api/posts.controller';
import { CreatePostUseCase } from '@lumio/modules/posts/application/use-case/create-post.usecase';
import { UserAccountsModule } from '@lumio/modules/user-accounts/user-accounts.module';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { UpdatePostUseCase } from '@lumio/modules/posts/application/use-case/update-post.usecase';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { DeletePostUseCase } from '@lumio/modules/posts/application/use-case/delete-post.usecase';
import { GetCreatePostUseCase } from './application/query/get-by-id-create-post.query-handler copy';
import { JwtModule } from '@nestjs/jwt';
import { SessionsModule } from '../sessions/sessions.module';
import { MainController } from './api/main.controller';
import { GetMainPageQueryUseCase } from './application/query/get-main-page.query-handelr';
import { GetAllUserPostsUseCase } from './application/query/get-all-user-posts.query-handler';

const useCases = [
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
  GetCreatePostUseCase,
  GetMainPageQueryUseCase,
  GetCreatePostUseCase,
  GetAllUserPostsUseCase,
];

const services = [];

const repository = [PostRepository];

const queryRepository = [QueryPostRepository];

@Module({
  imports: [UserAccountsModule, JwtModule, SessionsModule],

  controllers: [PostsController, MainController],
  providers: [
    ...services,
    ...useCases,
    ...repository,
    ...queryRepository,
    QueryPostRepository,
  ],
})
export class PostsModule {}
