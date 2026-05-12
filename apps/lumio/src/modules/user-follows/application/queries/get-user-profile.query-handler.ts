import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserFollowQueryRepository } from '../../domain/infrastructure/user-follow.query-repository';
import { UserProfileViewDto } from '../../api/dto/output/user-profile.view-dto';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { ExternalQueryPostsRepository } from '@lumio/modules/posts/domain/infrastructure/post.external-query.repository';

export class GetUserProfileQuery {
  constructor(
    public readonly currentUserId: number | null,
    public readonly targetUserId: number,
  ) {}
}

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileQueryHandler implements IQueryHandler<
  GetUserProfileQuery,
  UserProfileViewDto
> {
  constructor(
    private readonly userFollowQueryRepository: UserFollowQueryRepository,
    private readonly externalQueryUserRepository: ExternalQueryUserAccountsRepository,
    private readonly externalQueryPostsRepository: ExternalQueryPostsRepository,
  ) {}

  async execute(query: GetUserProfileQuery): Promise<UserProfileViewDto> {
    const { currentUserId, targetUserId } = query;

    const user =
      await this.externalQueryUserRepository.getUserInfo(targetUserId);

    if (!user) {
      throw NotFoundDomainException.create('User not found', 'userId');
    }

    const profile =
      await this.externalQueryUserRepository.getProfileByUserId(targetUserId);

    if (!profile) {
      throw NotFoundDomainException.create('Profile not found', 'userId');
    }

    const postsCount =
      await this.externalQueryPostsRepository.getPostsCountByUserId(
        targetUserId,
      );

    const isFollowing = currentUserId
      ? await this.userFollowQueryRepository.isFollowing(
          currentUserId,
          targetUserId,
        )
      : false;

    return new UserProfileViewDto({
      id: user.id,
      username: user.username,
      avatarUrl: profile?.avatarUrl,
      aboutMe: profile?.aboutMe,
      followersCount: profile?.followersCount || 0,
      followingCount: profile?.followingCount || 0,
      postsCount,
      isFollowing,
      isCurrentUser: currentUserId !== null && currentUserId === targetUserId,
    });
  }
}
