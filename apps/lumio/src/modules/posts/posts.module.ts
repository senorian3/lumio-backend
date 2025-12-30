import { Module } from '@nestjs/common';
import { PostsController } from './api/posts.controller';
import { CreatePostUseCase } from '@lumio/modules/posts/application/use-case/command/create-post.usecase';
import { UserAccountsModule } from '@lumio/modules/user-accounts/user-accounts.module';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { UpdatePostUseCase } from '@lumio/modules/posts/application/use-case/command/update-post.usecase';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { DeletePostUseCase } from '@lumio/modules/posts/application/use-case/command/delete-post.usecase';
import { GetCreatePostUseCase } from './application/use-case/query/get-by-id-create-post.usecase';
import { JwtModule } from '@nestjs/jwt';
import { SessionsModule } from '../sessions/sessions.module';
import { MainController } from './api/main.controller';
import { GetAllUserPostsUseCase } from './application/use-case/query/get-all-user-posts.usecase';
import { LoggerModule } from '@libs/logger/logger.module';
import { GetMainPageUseCase } from './application/use-case/query/get-main-page.usecase';
import { HttpService } from './application/http.service';

const useCases = [
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
  GetCreatePostUseCase,
  GetMainPageUseCase,
  GetCreatePostUseCase,
  GetAllUserPostsUseCase,
];

const services = [HttpService];

const repository = [PostRepository];

const queryRepository = [QueryPostRepository];

@Module({
  imports: [UserAccountsModule, JwtModule, SessionsModule, LoggerModule],

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
