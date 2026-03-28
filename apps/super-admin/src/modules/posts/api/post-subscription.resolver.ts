import { Resolver, Subscription } from '@nestjs/graphql';
// import { UseGuards } from '@nestjs/common';
// import { BasicAuthGuard } from '@super-admin/core/guard/basic-auth.guard';
import { PostCreatedSubscription } from '../domain/schema/post/post-created-subscription.schema';
import { PostsSubscriptionService } from '../application/posts-subscription.service';

@Resolver(() => PostCreatedSubscription)
// @UseGuards(BasicAuthGuard)
export class PostSubscriptionResolver {
  constructor(
    private readonly postsSubscriptionService: PostsSubscriptionService,
  ) {}

  @Subscription(() => PostCreatedSubscription, {
    name: 'postCreated',
    resolve: (value) => {
      return value?.postCreated;
    },
  })
  postCreated() {
    return this.postsSubscriptionService.pubSub.asyncIterableIterator(
      'postCreated',
    );
  }
}
