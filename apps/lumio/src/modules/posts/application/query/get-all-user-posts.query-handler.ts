// import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
// import { PostQueryRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
// import { PostView } from '@lumio/modules/posts/api/dto/output/create-post.output';
// import { GetPostsQueryParams } from '../../api/dto/input/get-all-user-posts.query.dto';
// import { PostEntity } from '../../domain/entities/post.entity';
// import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';

// export class GetAllUserPostsQuery {
//   constructor(
//     public readonly userId: number,
//     public readonly query: GetPostsQueryParams,
//   ) {}
// }

// @QueryHandler(GetAllUserPostsQuery)
// export class GetAllUserPostsQueryHandler implements IQueryHandler<
//   GetAllUserPostsQuery,
//   PaginatedViewDto<PostView[]>
// > {
//   constructor(private readonly postQueryRepository: PostQueryRepository) {}

//   async execute(
//     command: GetAllUserPostsQuery,
//   ): Promise<PaginatedViewDto<PostView[]>> {
//     const paginatedPosts: PaginatedViewDto<PostEntity[]> =
//       await this.postQueryRepository.findUserPosts(
//         command.userId,
//         command.query,
//       );

//     const postIds: number[] = paginatedPosts.items.map((post) => post.id);

//     // const userPostsFiles: OutputFilesDto[] =
//     // await this.rabbitMQService.getUsersPostsRpc(postIds);

//     // const view: PostView[] = paginatedPosts.items.map((post) =>
//     // PostView.fromEntity(post, userPostsFiles),
//     // );

//     const result: PaginatedViewDto<PostView[]> = {
//       items: view,
//       page: paginatedPosts.page,
//       pageSize: paginatedPosts.pageSize,
//       pagesCount: paginatedPosts.pagesCount,
//       totalCount: paginatedPosts.totalCount,
//     };
//     return result;
//   }
// }
