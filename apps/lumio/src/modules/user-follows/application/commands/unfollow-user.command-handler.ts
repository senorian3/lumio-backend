import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserFollowRepository } from '../../domain/infrastructure/user-follow.repository';
import { FollowStatusViewDto } from '../../api/dto/output/follow-status.view-dto';

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

    await this.userFollowRepository.getUserProfileWithFilledCheck(followerId);

    await this.userFollowRepository.getUser(followingId);

    await this.userFollowRepository.deleteFollowWithCounters(
      followerId,
      followingId,
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
