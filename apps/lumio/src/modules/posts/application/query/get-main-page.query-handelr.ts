import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostView } from '@lumio/modules/posts/api/dto/output/create-post.output';
import { MainPageView } from '@lumio/modules/posts/api/dto/output/main-page.output';
import { PostEntity } from '../../domain/entities/post.entity';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import axios from 'axios';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ConfigService } from '@nestjs/config';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';

export class GetMainPageQuery {
  constructor() {}
}

@QueryHandler(GetMainPageQuery)
export class GetMainPageQueryUseCase implements IQueryHandler<
  GetMainPageQuery,
  MainPageView
> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(): Promise<MainPageView> {
    const lastPosts: PostEntity[] = await this.postRepository.getLastPosts(4);
    const lastRegisteredUsersCount: number =
      await this.userRepository.getRegisteredUsersCount();

    const postIdsUser: number[] = lastPosts.map((post) => post.id);

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

    const view: PostView[] = lastPosts.map((post) =>
      PostView.fromEntity(post, userPostsFiles),
    );

    return new MainPageView(view, lastRegisteredUsersCount);
  }
}
