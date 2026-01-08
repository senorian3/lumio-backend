import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MainPageView } from '@lumio/modules/posts/api/dto/output/main-page.output.dto';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { Post } from 'generated/prisma-lumio';

export class GetMainPageQuery {
  constructor() {}
}

@QueryHandler(GetMainPageQuery)
export class GetMainPageQueryHandler implements IQueryHandler<
  GetMainPageQuery,
  MainPageView
> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(): Promise<MainPageView> {
    const lastPosts: Post[] = await this.postRepository.getLastPosts(4);
    const allRegisteredUsersCount: number =
      await this.userRepository.getRegisteredUsersCount();

    return new MainPageView(lastPosts, allRegisteredUsersCount);
  }
}
