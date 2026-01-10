import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ProfileView } from '../../api/dto/output/profile.output.dto';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';

export class GetProfileOrPostQuery {
  constructor(
    public userId: number,
    public postId?: number,
  ) {}
}

@QueryHandler(GetProfileOrPostQuery)
export class GetProfileOrPostQueryHandler implements IQueryHandler<
  GetProfileOrPostQuery,
  ProfileView | PostView
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly postRepository: PostRepository,
  ) {}

  async execute(query: GetProfileOrPostQuery): Promise<ProfileView | PostView> {
    const user = await this.userRepository.findUserById(query.userId);

    if (!user) {
      throw NotFoundDomainException.create('User not found', 'userId');
    }

    if (query.postId) {
      const post = await this.postRepository.findById(query.postId);

      if (!post) {
        throw NotFoundDomainException.create('Post does not exist', 'postId');
      }

      return PostView.fromPrisma(post);
    }

    return ProfileView.fromEntity(user);
  }
}
