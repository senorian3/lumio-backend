import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MainPageView } from '@lumio/modules/posts/api/dto/output/main-page.output.dto';
import { PostEntity } from '../../../domain/entities/post.entity';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import axios from 'axios';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { PostView } from '../../../api/dto/output/create-post.output.dto';
import { CoreConfig } from '@lumio/core/core.config';

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
    private readonly coreConfig: CoreConfig,
  ) {}

  async execute(): Promise<MainPageView> {
    const lastPosts: PostEntity[] = await this.postRepository.getLastPosts(4);
    const lastRegisteredUsersCount: number =
      await this.userRepository.getRegisteredUsersCount();

    const postIdsUser: number[] = lastPosts.map((post) => post.id);

    let userPostsFiles: OutputFileType[] = [];

    const filesFrontendUrl = this.coreConfig.filesFrontendUrl;
    const internalApiKey = this.coreConfig.internalApiKey;

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

    const view: PostView[] = lastPosts.map((post) =>
      PostView.fromEntity(post, userPostsFiles),
    );

    return new MainPageView(view, lastRegisteredUsersCount);
  }
}
