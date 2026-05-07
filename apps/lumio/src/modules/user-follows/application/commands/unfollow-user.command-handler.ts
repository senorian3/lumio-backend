import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserFollowRepository } from '../../domain/infrastructure/user-follow.repository';
import { FollowStatusViewDto } from '../../api/dto/output/follow-status.view-dto';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';

export class UnfollowUserCommand {
  constructor(
    public readonly followerId: number,
    public readonly followingId: number,
  ) {}
}

@CommandHandler(UnfollowUserCommand)
export class UnfollowUserCommandHandler implements ICommandHandler<
  UnfollowUserCommand,
  FollowStatusViewDto
> {
  constructor(
    private readonly userFollowRepository: UserFollowRepository,
    private readonly externalQueryUserRepository: ExternalQueryUserAccountsRepository,
  ) {}

  async execute(command: UnfollowUserCommand): Promise<FollowStatusViewDto> {
    const { followerId, followingId } = command;

    if (followerId === followingId) {
      throw BadRequestDomainException.create(
        'Cannot unfollow yourself',
        'followingId',
      );
    }

    const following = await this.userFollowRepository.isAlreadyFollowing(
      followerId,
      followingId,
    );

    if (!following) {
      throw BadRequestDomainException.create(
        'Not following this user',
        'followingId',
      );
    }

    const profile =
      await this.externalQueryUserRepository.getProfileByUserId(followerId);
    if (!profile || !profile.profileFilled) {
      throw ForbiddenDomainException.create(
        'Profile is not filled',
        'profileFilled',
      );
    }

    const user =
      await this.externalQueryUserRepository.getUserInfo(followingId);
    if (!user) {
      throw NotFoundDomainException.create('User not found', 'userId');
    }

    await this.userFollowRepository.deleteFollowWithCounters(
      followerId,
      followingId,
      following.id,
    );

    const followerCounters =
      await this.externalQueryUserRepository.getProfileCounters(followerId);
    const followingCounters =
      await this.externalQueryUserRepository.getProfileCounters(followingId);

    return FollowStatusViewDto.create(
      false,
      followingCounters.followersCount,
      followerCounters.followingCount,
    );
  }
}
