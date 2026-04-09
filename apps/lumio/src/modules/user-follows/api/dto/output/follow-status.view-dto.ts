import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FollowStatusViewDto {
  @ApiProperty({
    description: 'Whether the current user is following the target user',
    example: true,
  })
  @Expose()
  isFollowing: boolean;

  @ApiProperty({
    description: 'Number of followers of the target user',
    example: 150,
  })
  @Expose()
  followersCount: number;

  @ApiProperty({
    description: 'Number of users the target user is following',
    example: 85,
  })
  @Expose()
  followingCount: number;

  constructor(partial: Partial<FollowStatusViewDto>) {
    Object.assign(this, partial);
  }

  static create(
    isFollowing: boolean,
    followersCount: number,
    followingCount: number,
  ): FollowStatusViewDto {
    return new FollowStatusViewDto({
      isFollowing,
      followersCount,
      followingCount,
    });
  }
}
