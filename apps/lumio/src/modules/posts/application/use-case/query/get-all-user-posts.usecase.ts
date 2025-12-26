import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPostsQueryParams } from '../../../api/dto/input/get-all-user-posts.query.dto';
import { PostEntity } from '../../../domain/entities/post.entity';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { QueryPostRepository } from '../../../domain/infrastructure/post.query.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PostView } from '../../../api/dto/output/create-post.output.dto';
import { HttpService } from '../../http.service';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';

export class GetAllUserPostsCommand {
  constructor(
    public readonly userId: number,
    public readonly query: GetPostsQueryParams,
  ) {}
}

@QueryHandler(GetAllUserPostsCommand)
export class GetAllUserPostsUseCase implements IQueryHandler<
  GetAllUserPostsCommand,
  PaginatedViewDto<PostView[]>
> {
  constructor(
    private readonly postQueryRepository: QueryPostRepository,
    private readonly httpService: HttpService,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(
    command: GetAllUserPostsCommand,
  ): Promise<PaginatedViewDto<PostView[]>> {
    const paginatedPosts: PaginatedViewDto<PostEntity[]> =
      await this.postQueryRepository.findUserPosts(
        command.userId,
        command.query,
      );

    const postIdsUser: number[] = paginatedPosts.items.map((post) => post.id);

    let userPostsFiles: OutputFileType[] = [];

    try {
      userPostsFiles = await this.httpService.post<OutputFileType[]>(
        `${GLOBAL_PREFIX}/files`,
        { postIds: [...postIdsUser] },
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch files from postId=${postIdsUser}: ${error.message}`,
        error?.stack,
        GetAllUserPostsUseCase.name,
      );
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
