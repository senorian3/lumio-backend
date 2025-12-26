import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostQueryRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { PostView } from '@lumio/modules/posts/api/dto/output/create-post.output';
import { GetPostsQueryParams } from '../../api/dto/input/get-all-user-posts.query.dto';
import { PostEntity } from '../../domain/entities/post.entity';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import axios from 'axios';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';

export class GetAllUserPostsQuery {
  constructor(
    public readonly userId: number,
    public readonly query: GetPostsQueryParams,
  ) {}
}

@QueryHandler(GetAllUserPostsQuery)
export class GetAllUserPostsQueryHandler implements IQueryHandler<
  GetAllUserPostsQuery,
  PaginatedViewDto<PostView[]>
> {
  constructor(private readonly postQueryRepository: PostQueryRepository) {}

  async execute(
    command: GetAllUserPostsQuery,
  ): Promise<PaginatedViewDto<PostView[]>> {
    const paginatedPosts: PaginatedViewDto<PostEntity[]> =
      await this.postQueryRepository.findUserPosts(
        command.userId,
        command.query,
      );

    const postIdsUser: number[] = paginatedPosts.items.map((post) => post.id);

    let userPostsFiles: OutputFileType[] = [];
    try {
      const response = await axios.post<OutputFileType[]>(
        'http://localhost:3003/api/v1/files',
        { postIds: [...postIdsUser] },
      );
      userPostsFiles = response.data;
    } catch (error) {
      console.error(error);
      throw NotFoundDomainException.create('Failed to fetch files', 'files');
    }

    const view: PostView[] = paginatedPosts.items.map((post) =>
      PostView.fromEntity(post, userPostsFiles),
    );

    const result: PaginatedViewDto<PostView[]> = {
      page: paginatedPosts.page,
      pageSize: paginatedPosts.pageSize,
      pagesCount: paginatedPosts.pagesCount,
      totalCount: paginatedPosts.totalCount,
      items: view,
    };
    return result;
  }
}
