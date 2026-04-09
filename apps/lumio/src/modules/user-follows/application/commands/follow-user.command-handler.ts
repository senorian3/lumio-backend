import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserFollowRepository } from '../../domain/infrastructure/user-follow.repository';
import { FollowStatusViewDto } from '../../api/dto/output/follow-status.view-dto';
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
  constructor(private readonly userFollowRepository: UserFollowRepository) {}

  async execute(command: FollowUserCommand): Promise<FollowStatusViewDto> {
    const { followerId, followingId } = command;

    await this.userFollowRepository.getUser(followingId);

    await this.userFollowRepository.createFollowWithCounters(
      followerId,
      followingId,
    );

    const followerCounters =
      await this.userFollowRepository.getProfileCounters(followerId);
    const followingCounters =
      await this.userFollowRepository.getProfileCounters(followingId);

    return FollowStatusViewDto.create(
      true,
      followingCounters.followersCount,
      followerCounters.followingCount,
    );
  }
}
