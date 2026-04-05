import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserSearchViewDto {
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
    description: 'Whether the current user is following this user',
    example: true,
  })
  @Expose()
  isFollowing: boolean;

  constructor(partial: Partial<UserSearchViewDto>) {
    Object.assign(this, partial);
  }

  static fromPrisma(user: any, isFollowing: boolean): UserSearchViewDto {
    return new UserSearchViewDto({
      id: user.id,
      username: user.username,
      avatarUrl: user.profile?.avatarUrl,
      isFollowing,
    });
  }
}
