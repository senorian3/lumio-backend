import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MainPageView } from '@lumio/modules/posts/api/dto/output/main-page.output.dto';
import { PostEntity } from '../../../domain/entities/post.entity';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { PostView } from '../../../api/dto/output/create-post.output.dto';
import { HttpService } from '../../http.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

export class GetMainPageCommand {
  constructor() {}
}

@QueryHandler(GetMainPageCommand)
export class GetMainPageUseCase implements IQueryHandler<
  GetMainPageCommand,
  MainPageView
> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly userRepository: UserRepository,
    private readonly httpService: HttpService,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(): Promise<MainPageView> {
    const lastPosts: PostEntity[] = await this.postRepository.getLastPosts(4);
    const allRegisteredUsersCount: number =
      await this.userRepository.getRegisteredUsersCount();

    const postIdsUser: number[] = lastPosts.map((post) => post.id);

    let userPostsFiles: OutputFileType[] = [];

    try {
      userPostsFiles = await this.httpService.post<OutputFileType[]>(
        `${GLOBAL_PREFIX}/files`,
        { postIds: [...postIdsUser] },
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch files for posts: ${postIdsUser}: ${error.message}`,
        error?.stack,
        GetMainPageUseCase.name,
      );
      throw BadRequestDomainException.create('Failed to fetch files', 'files');
    }

    const view: PostView[] = lastPosts.map((post) =>
      PostView.fromEntity(post, userPostsFiles),
    );

    return new MainPageView(view, allRegisteredUsersCount);
  }
}
