import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostView } from '@lumio/modules/posts/api/dto/output/create-post.output';
import { GetPostsQueryParams } from '../../api/dto/input/get-all-user-posts.query.dto';
import { PostEntity } from '../../domain/entities/post.entity';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import axios from 'axios';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { QueryPostRepository } from '../../domain/infrastructure/post.query.repository';
import { ConfigService } from '@nestjs/config';

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
  constructor(
    private readonly postQueryRepository: QueryPostRepository,
    private readonly configService: ConfigService,
  ) {}

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

    const internalApiKey = this.configService.get('INTERNAL_API_KEY');
    const filesFrontendUrl = this.configService.get('FILES_FRONTEND_URL');

    try {
      const response = await axios.post<OutputFileType[]>(
        `${filesFrontendUrl}/api/v1/files`,
        { postIds: [...postIdsUser] },
        {
          headers: {
            'X-Internal-API-Key': internalApiKey,
            'Content-Type': 'application/json',
          },
        },
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
