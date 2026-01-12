import { Module } from '@nestjs/common';
import { PostsController } from './api/posts.controller';
import { CreatePostCommandHandler } from '@lumio/modules/posts/application/commands/create-post.command-handler';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { UpdatePostCommandHandler } from '@lumio/modules/posts/application/commands/update-post.command-handler';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { DeletePostCommandHandler } from '@lumio/modules/posts/application/commands/delete-post.command-handler';
import { GetCreatePostQueryHandler } from './application/queries/get-by-id-create-post.query-handler';
import { JwtModule } from '@nestjs/jwt';
import { SessionsModule } from '../sessions/sessions.module';
import { MainController } from './api/main.controller';
import { GetAllUserPostsQueryHandler } from './application/queries/get-all-user-posts.query-handler';
import { LoggerModule } from '@libs/logger/logger.module';
import { GetMainPageQueryHandler } from './application/queries/get-main-page.query-handler';
import { SharedModule } from '@libs/shared/shared.module';
import { UserQueryModule } from '../user-accounts/user-query.module';
import { GetProfilePostQueryHandler } from './application/queries/get-profile-post.query-handler';

const useCases = [
  CreatePostCommandHandler,
  UpdatePostCommandHandler,
  DeletePostCommandHandler,
  GetCreatePostQueryHandler,
  GetMainPageQueryHandler,
  GetCreatePostQueryHandler,
  GetAllUserPostsQueryHandler,
  GetProfilePostQueryHandler,
];

const repository = [PostRepository];

const queryRepository = [QueryPostRepository];

@Module({
  imports: [
    SharedModule,
    UserQueryModule,
    JwtModule,
    SessionsModule,
    LoggerModule,
  ],

  controllers: [PostsController, MainController],
  providers: [...useCases, ...repository, ...queryRepository],
})
export class PostsModule {}
