import {
  Args,
  Int,
  Parent,
  ResolveField,
  Resolver,
  Query,
  Subscription,
} from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { Inject, UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from '@super-admin/core/guard/basic-auth.guard';
import { Post } from '@super-admin/modules/posts/domain/schema/post/post.schema';
import { PaginatedPostResponse } from '../domain/schema/post/paginated-post.schema';
import { User } from '@super-admin/modules/users/domain/schema/user/user.schema';
import { PostFile } from '@super-admin/modules/posts/domain/schema/post/post-file.schema';
import { PostSortBy } from '@super-admin/modules/posts/domain/schema/post/post-sort-by.enum';
import { GetPostsQuery } from '@super-admin/modules/posts/application/queries/get-posts.query-handler';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from '@libs/graphql/pub-sub.module';

@Resolver(() => Post)
@UseGuards(BasicAuthGuard)
export class PostResolver {
  constructor(
    private readonly queryBus: QueryBus,
    @Inject(PUB_SUB)
    private readonly pubSub: PubSub,
  ) {}

  @Query(() => PaginatedPostResponse)
  async getPosts(
    @Args('pageNumber', { type: () => Int, defaultValue: 1 })
    pageNumber: number,
    @Args('pageSize', { type: () => Int, defaultValue: 20 })
    pageSize: number,
    @Args('sortBy', {
      type: () => PostSortBy,
      defaultValue: PostSortBy.DATE_DESC,
    })
    sortBy: PostSortBy = PostSortBy.DATE_DESC,
    @Args('search', { type: () => String, nullable: true })
    search?: string,
  ): Promise<PaginatedPostResponse> {
    return await this.queryBus.execute(
      new GetPostsQuery(pageNumber, pageSize, sortBy, search),
    );
  }

  @Subscription(() => Post, {
    filter: (payload, variables, context) => {
      return !!context.user;
    },
  })
  postCreated() {
    return (this.pubSub as any).asyncIterator('POST_CREATED_EVENT');
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() post: Post): Promise<User | null> {
    return post.user || null;
  }

  @ResolveField(() => [PostFile])
  async files(@Parent() post: Post): Promise<PostFile[]> {
    return post.files || [];
  }
}
