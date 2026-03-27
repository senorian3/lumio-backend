import {
  Args,
  Int,
  Parent,
  ResolveField,
  Resolver,
  Query,
} from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from '@super-admin/core/guard/basic-auth.guard';
import { Post } from '@super-admin/modules/posts/domain/schema/post/post.schema';
import { PaginatedPostResponse } from '../domain/schema/post/paginated-post.schema';
import { User } from '@super-admin/modules/users/domain/schema/user/user.schema';
import { PostFile } from '@super-admin/modules/posts/domain/schema/post/post-file.schema';
import { PostSortBy } from '@super-admin/modules/posts/domain/schema/post/post-sort-by.enum';
import { GetPostsQuery } from '@super-admin/modules/posts/application/queries/get-posts.query-handler';

@Resolver(() => Post)
@UseGuards(BasicAuthGuard)
export class PostResolver {
  constructor(private readonly queryBus: QueryBus) {}

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

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() post: Post): Promise<User | null> {
    return post.user || null;
  }

  @ResolveField(() => [PostFile])
  async files(@Parent() post: Post): Promise<PostFile[]> {
    return post.files || [];
  }
}
