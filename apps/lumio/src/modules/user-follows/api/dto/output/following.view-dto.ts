import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FollowingViewDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  @Expose()
  username: string;

  @ApiProperty({
    description: 'URL of user avatar',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @Expose()
  avatarUrl?: string;

  @ApiProperty({
    description: 'Date when user was followed',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  followedAt: Date;

  constructor(partial: Partial<FollowingViewDto>) {
    Object.assign(this, partial);
  }

  static fromPrisma(follow: any): FollowingViewDto {
    return new FollowingViewDto({
      id: follow.following.id,
      username: follow.following.username,
      avatarUrl: follow.following.profile?.avatarUrl,
      followedAt: follow.createdAt,
    });
  }
}
