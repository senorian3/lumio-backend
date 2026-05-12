import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserProfileViewDto {
  @Expose()
  @ApiProperty({ example: 123, description: 'User ID' })
  id: number;

  @Expose()
  @ApiProperty({ example: 'john_doe', description: 'Username' })
  username: string;

  @Expose()
  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
    required: false,
  })
  avatarUrl?: string;

  @Expose()
  @ApiProperty({
    example: 'Software developer from New York',
    description: 'About me text',
    required: false,
  })
  aboutMe?: string;

  @Expose()
  @ApiProperty({ example: 150, description: 'Number of followers' })
  followersCount: number;

  @Expose()
  @ApiProperty({ example: 85, description: 'Number of following users' })
  followingCount: number;

  @Expose()
  @ApiProperty({ example: 42, description: 'Number of posts' })
  postsCount: number;

  @Expose()
  @ApiProperty({
    example: true,
    description: 'Whether current user is following this user',
  })
  isFollowing: boolean;

  @Expose()
  @ApiProperty({
    example: false,
    description: "Whether this is the current user's own profile",
  })
  isCurrentUser: boolean;

  constructor(partial: Partial<UserProfileViewDto>) {
    Object.assign(this, partial);
  }

  static fromPrisma(
    user: any,
    profile: any,
    postsCount: number,
    isFollowing: boolean,
    isCurrentUser: boolean,
  ): UserProfileViewDto {
    return new UserProfileViewDto({
      id: user.id,
      username: user.username,
      avatarUrl: profile?.avatarUrl,
      aboutMe: profile?.aboutMe,
      followersCount: profile?.followersCount || 0,
      followingCount: profile?.followingCount || 0,
      postsCount,
      isFollowing,
      isCurrentUser,
    });
  }
}
