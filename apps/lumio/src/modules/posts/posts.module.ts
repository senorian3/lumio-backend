import { Module } from '@nestjs/common';
import { PostsController } from './api/posts.controller';
import { CreatePostUseCase } from '@lumio/modules/posts/application/use-case/create-post.usecase';
import { UserAccountsModule } from '@lumio/modules/user-accounts/user-accounts.module';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { UpdatePostUseCase } from '@lumio/modules/posts/application/use-case/update-post.usecase';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { DeletePostUseCase } from '@lumio/modules/posts/application/use-case/delete-post.usecase';
import { GetCreatePostQueryHandler } from './application/query/get-by-id-create-post.query-handler copy';
// import { GetAllUserPostsQueryHandler } from './application/query/get-all-user-posts.query-handler';
import { JwtModule } from '@nestjs/jwt';
import { SessionsModule } from '../sessions/sessions.module';

const useCases = [CreatePostUseCase, UpdatePostUseCase, DeletePostUseCase];

const services = [];

const repository = [PostRepository];

const queryRepository = [QueryPostRepository];

@Module({
  imports: [UserAccountsModule, JwtModule, SessionsModule],

  controllers: [PostsController],
  providers: [
    ...services,
    ...useCases,
    ...repository,
    ...queryRepository,
    GetCreatePostQueryHandler,
    QueryPostRepository,
    // GetAllUserPostsQueryHandler,
  ],
})
export class PostsModule {}
