import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { SearchUsersInputDto } from '../../api/dto/input/search-users.input-dto';
import { UserSearchViewDto } from '../../api/dto/output/user-search.view-dto';
import { PaginatedUserSearchViewDto } from '../../api/dto/output/user-search.paginated.view-dto';
import { UserProfileViewDto } from '../../api/dto/output/user-profile.view-dto';

@Injectable()
export class UserFollowQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(
    currentUserId: number,
    query: SearchUsersInputDto,
  ): Promise<PaginatedUserSearchViewDto> {
    const { username, pageNumber, pageSize } = query;
    const skip = query.calculateSkip();

    const followingIds = await this.getFollowingIds(currentUserId);

    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          username: {
            contains: username,
            mode: 'insensitive',
          },
          deletedAt: null,
          isBlocked: false,
          id: { not: currentUserId },
        },
        include: {
          profile: true,
        },
        orderBy: { username: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({
        where: {
          username: {
            contains: username,
            mode: 'insensitive',
          },
          deletedAt: null,
          isBlocked: false,
          id: { not: currentUserId },
        },
      }),
    ]);

    const items = users.map((user) =>
      UserSearchViewDto.fromPrisma(user, followingIds.includes(user.id)),
    );

    return {
      items,
      totalCount,
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
    };
  }

  async getUserProfile(
    currentUserId: number,
    targetUserId: number,
  ): Promise<UserProfileViewDto> {
    const [user, profile, postsCount, isFollowing] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: targetUserId, deletedAt: null, isBlocked: false },
      }),
      this.prisma.userProfile.findUnique({
        where: { userId: targetUserId },
      }),
      this.prisma.post.count({
        where: { userId: targetUserId, deletedAt: null },
      }),
      this.isFollowing(currentUserId, targetUserId),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    return UserProfileViewDto.fromPrisma(
      user,
      profile,
      postsCount,
      isFollowing,
      currentUserId === targetUserId,
    );
  }

  async getFollowingIds(userId: number): Promise<number[]> {
    const follows = await this.prisma.userFollow.findMany({
      where: {
        followerId: userId,
        deletedAt: null,
      },
      select: { followingId: true },
    });

    return follows.map((follow) => follow.followingId);
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.prisma.userFollow.findFirst({
      where: {
        followerId,
        followingId,
        deletedAt: null,
      },
    });

    return !!follow;
  }

  async getProfileCounters(userId: number): Promise<{
    followersCount: number;
    followingCount: number;
  }> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { followersCount: true, followingCount: true },
    });

    return {
      followersCount: profile?.followersCount || 0,
      followingCount: profile?.followingCount || 0,
    };
  }
}
