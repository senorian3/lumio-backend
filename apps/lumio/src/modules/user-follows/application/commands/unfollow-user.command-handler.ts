import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserFollowRepository } from '../../domain/infrastructure/user-follow.repository';
import { FollowStatusViewDto } from '../../api/dto/output/follow-status.view-dto';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';

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
  constructor(private readonly userFollowRepository: UserFollowRepository) {}

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
        'Already following this user',
        'followingId',
      );
    }

    const profile = await this.userFollowRepository.getUserProfile(followerId);
    if (!profile || !profile.profileFilled) {
      throw ForbiddenDomainException.create(
        'Profile is not filled',
        'profileFilled',
      );
    }

    const user = await this.userFollowRepository.getUser(followingId);
    if (!user) {
      throw NotFoundDomainException.create('User not found', 'userId');
    }

    await this.userFollowRepository.deleteFollowWithCounters(
      followerId,
      followingId,
      following.id,
    );

    const followerCounters =
      await this.userFollowRepository.getProfileCounters(followerId);
    const followingCounters =
      await this.userFollowRepository.getProfileCounters(followingId);

    return FollowStatusViewDto.create(
      false,
      followingCounters.followersCount,
      followerCounters.followingCount,
    );
  }
}
