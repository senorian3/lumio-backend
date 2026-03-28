import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { PostResolver } from '@super-admin/modules/posts/api/posts.resolver';
import { GetPostsQueryHandler } from '@super-admin/modules/posts/application/queries/get-posts.query-handler';
import { PostsQueryRepository } from '@super-admin/modules/posts/domain/infrastructure/posts.query-repository';

const repositories = [PostsQueryRepository];
const queryHandlers = [GetPostsQueryHandler];
const commandHandlers = [];

@Module({
  imports: [PrismaModule, CqrsModule],
  providers: [
    PostResolver,
    ...repositories,
    ...queryHandlers,
    ...commandHandlers,
  ],
  exports: [],
})
export class PostsModule {}
