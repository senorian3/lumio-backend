import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { SearchUsersInputDto } from '../../api/dto/input/search-users.input-dto';
import { UserSearchViewDto } from '../../api/dto/output/user-search.view-dto';
import { PaginatedUserSearchViewDto } from '../../api/dto/output/user-search.paginated.view-dto';
import { PaginatedFollowersViewDto } from '../../api/dto/output/followers.paginated.view-dto';
import { PaginatedFollowingViewDto } from '../../api/dto/output/following.paginated.view-dto';
import { FollowerViewDto } from '../../api/dto/output/follower.view-dto';
import { FollowingViewDto } from '../../api/dto/output/following.view-dto';

@Injectable()
export class UserFollowQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(
    currentUserId: number,
    query: SearchUsersInputDto,
    followingIds: number[],
  ): Promise<PaginatedUserSearchViewDto> {
    const { username, pageNumber, pageSize } = query;
    const skip = query.calculateSkip();

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

  async getFollowers(
    userId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedFollowersViewDto> {
    const skip = (page - 1) * limit;

    const [follows, totalCount] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: {
          followingId: userId,
          deletedAt: null,
        },
        include: {
          follower: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userFollow.count({
        where: {
          followingId: userId,
          deletedAt: null,
        },
      }),
    ]);

    const items = follows.map((follow) => FollowerViewDto.fromPrisma(follow));

    return {
      items,
      totalCount,
      pagesCount: Math.ceil(totalCount / limit),
      page,
      pageSize: limit,
    };
  }

  async getFollowing(
    userId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedFollowingViewDto> {
    const skip = (page - 1) * limit;

    const [follows, totalCount] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: {
          followerId: userId,
          deletedAt: null,
        },
        include: {
          following: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userFollow.count({
        where: {
          followerId: userId,
          deletedAt: null,
        },
      }),
    ]);

    const items = follows.map((follow) => FollowingViewDto.fromPrisma(follow));

    return {
      items,
      totalCount,
      pagesCount: Math.ceil(totalCount / limit),
      page,
      pageSize: limit,
    };
  }
}
