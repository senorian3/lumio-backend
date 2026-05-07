import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserFollowRepository } from '../../domain/infrastructure/user-follow.repository';
import { FollowStatusViewDto } from '../../api/dto/output/follow-status.view-dto';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';

export class FollowUserCommand {
  constructor(
    public readonly followerId: number,
    public readonly followingId: number,
  ) {}
}

@CommandHandler(FollowUserCommand)
export class FollowUserCommandHandler implements ICommandHandler<
  FollowUserCommand,
  FollowStatusViewDto
> {
  constructor(
    private readonly userFollowRepository: UserFollowRepository,
    private readonly externalQueryUserRepository: ExternalQueryUserAccountsRepository,
  ) {}

  async execute(command: FollowUserCommand): Promise<FollowStatusViewDto> {
    const { followerId, followingId } = command;

    if (followerId === followingId) {
      throw BadRequestDomainException.create(
        'Cannot follow yourself',
        'followingId',
      );
    }

    const alreadyFollowing = await this.userFollowRepository.isAlreadyFollowing(
      followerId,
      followingId,
    );

    if (alreadyFollowing) {
      throw BadRequestDomainException.create(
        'Already following this user',
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

    await this.userFollowRepository.createFollowWithCounters(
      followerId,
      followingId,
    );

    const followerCounters =
      await this.externalQueryUserRepository.getProfileCounters(followerId);
    const followingCounters =
      await this.externalQueryUserRepository.getProfileCounters(followingId);

    return FollowStatusViewDto.create(
      true,
      followingCounters.followersCount,
      followerCounters.followingCount,
    );
  }
}
