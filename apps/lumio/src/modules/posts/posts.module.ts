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
import { GetProfilePostQueryHandler } from './application/queries/get-profile-post.query-handler';
import { UserAccountsModule } from '@lumio/modules/user-accounts/user-accounts.module';
import { FilesHttpAdapter } from './application/files-http.adapter';
import { PostFilesRepository } from './domain/infrastructure/post-files.repository';
import { GetPostByIdQueryHandler } from '@lumio/modules/posts/application/queries/get-post-by-id.query-handler';
import { GetPostWithCommentsQueryHandler } from '@lumio/modules/posts/application/queries/get-post-with-comments.query-handler';
import { PostEventsPublisher } from './application/post-events.publisher';
import { CreateCommentCommandHandler } from './application/commands/create-comment.command-handler';
import { CommentRepository } from '@lumio/modules/posts/domain/infrastructure/comment.repository';
import { GetCreatedCommentQueryHandler } from './application/queries/get-created-comment.query-handler';
import { ExternalQueryPostsRepository } from './domain/infrastructure/post.external-query.repository';

const useCases = [
  CreatePostCommandHandler,
  UpdatePostCommandHandler,
  DeletePostCommandHandler,
  CreateCommentCommandHandler,
  GetCreatePostQueryHandler,
  GetMainPageQueryHandler,
  GetCreatePostQueryHandler,
  GetAllUserPostsQueryHandler,
  GetProfilePostQueryHandler,
  GetPostByIdQueryHandler,
  GetPostWithCommentsQueryHandler,
  GetCreatedCommentQueryHandler,
];

const adapters = [FilesHttpAdapter];

const repositories = [PostRepository, PostFilesRepository, CommentRepository];

const queryRepositories = [QueryPostRepository];

const externalQueryRepositories = [ExternalQueryPostsRepository];

const eventPublishers = [PostEventsPublisher];

@Module({
  imports: [UserAccountsModule, JwtModule, SessionsModule, LoggerModule],
  controllers: [PostsController, MainController],
  providers: [
    ...useCases,
    ...adapters,
    ...repositories,
    ...queryRepositories,
    ...externalQueryRepositories,
    ...eventPublishers,
  ],
  exports: [...externalQueryRepositories],
})
export class PostsModule {}
