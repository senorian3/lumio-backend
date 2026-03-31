import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { PostResolver } from '@super-admin/modules/posts/api/posts.resolver';
import { PostSubscriptionResolver } from '@super-admin/modules/posts/api/post-subscription.resolver';
import { GetPostsQueryHandler } from '@super-admin/modules/posts/application/queries/get-posts.query-handler';
import { PostsQueryRepository } from '@super-admin/modules/posts/domain/infrastructure/posts.query-repository';
import { PostsSubscriptionService } from '@super-admin/modules/posts/application/posts-subscription.service';

const repositories = [PostsQueryRepository];
const queryHandlers = [GetPostsQueryHandler];
const commandHandlers = [];
const subscriptionServices = [PostsSubscriptionService];
const resolvers = [PostResolver, PostSubscriptionResolver];

@Module({
  imports: [PrismaModule, CqrsModule],
  providers: [
    ...resolvers,
    ...repositories,
    ...queryHandlers,
    ...commandHandlers,
    ...subscriptionServices,
  ],
  exports: [],
})
export class PostsModule {}
