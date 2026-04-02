import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostSortBy } from '@super-admin/modules/posts/domain/schema/post/post-sort-by.enum';
import { PostsQueryRepository } from '@super-admin/modules/posts/domain/infrastructure/posts.query-repository';
import { PaginatedPostResponse } from '@super-admin/modules/posts/domain/schema/post/paginated-post.schema';
import { Post } from '@super-admin/modules/posts/domain/schema/post/post.schema';

export class GetPostsQuery {
  constructor(
    public readonly pageNumber: number = 1,
    public readonly pageSize: number = 10,
    public readonly sortBy: PostSortBy = PostSortBy.DATE_DESC,
    public readonly search?: string,
  ) {}
}

@QueryHandler(GetPostsQuery)
export class GetPostsQueryHandler implements IQueryHandler<GetPostsQuery> {
  constructor(private readonly postsQueryRepository: PostsQueryRepository) {}

  async execute(query: GetPostsQuery): Promise<PaginatedPostResponse> {
    const [prismaPosts, totalCount] = await Promise.all([
      this.postsQueryRepository.findPosts(
        query.pageNumber,
        query.pageSize,
        query.sortBy,
        query.search,
      ),
      this.postsQueryRepository.countPosts(query.search),
    ]);

    const posts: Post[] = prismaPosts.map((p) => ({
      id: p.id,
      description: p.description,
      createdAt: p.createdAt,
      deletedAt: p.deletedAt,
      userId: p.userId,
      user: p.user,
      files: p.files,
    }));

    const pagesCount = Math.ceil(totalCount / query.pageSize);

    return {
      page: query.pageNumber,
      pageSize: query.pageSize,
      pagesCount,
      totalCount,
      items: posts,
    };
  }
}
