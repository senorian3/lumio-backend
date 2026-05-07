import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';

@Injectable()
export class UserFollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isAlreadyFollowing(followerId: number, followingId: number) {
    const follow = await this.prisma.userFollow.findFirst({
      where: {
        followerId,
        followingId,
        deletedAt: null,
      },
    });
    return follow;
  }

  async createFollow(followerId: number, followingId: number, tx?: any) {
    const client = tx || this.prisma;

    return await client.userFollow.create({
      data: {
        followerId,
        followingId,
      },
    });
  }

  async deleteFollow(followId: number, tx?: any) {
    const client = tx || this.prisma;

    return await client.userFollow.delete({
      where: { id: followId },
    });
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

  async updateProfileCounters(
    userId: number,
    followersDelta: number,
    followingDelta: number,
    tx?: any,
  ) {
    const client = tx || this.prisma;

    await client.userProfile.update({
      where: { userId },
      data: {
        followersCount: { increment: followersDelta },
        followingCount: { increment: followingDelta },
      },
    });
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

  async checkUserExists(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null, isBlocked: false },
    });
    return !!user;
  }

  async createFollowWithCounters(followerId: number, followingId: number) {
    return this.prisma.$transaction(async (tx) => {
      const follow = await this.createFollow(followerId, followingId, tx);

      await this.updateProfileCounters(followerId, 0, 1, tx);

      await this.updateProfileCounters(followingId, 1, 0, tx);

      return follow;
    });
  }

  async deleteFollowWithCounters(
    followerId: number,
    followingId: number,
    followId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const result = await this.deleteFollow(followId, tx);

      await this.updateProfileCounters(followerId, 0, -1, tx);

      await this.updateProfileCounters(followingId, -1, 0, tx);

      return result;
    });
  }
}
