import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { UserProfile } from '@generated/prisma-lumio';

@Injectable()
export class ExternalQueryUserAccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserId(id: number): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return null;
    }

    return user.id;
  }

  async getUserInfo(id: number): Promise<{
    id: number;
    username: string;
    email: string;
    createdAt: Date;
    isBlocked: boolean;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        isBlocked: true,
      },
    });

    return user;
  }

  async getProfileByUserId(userId: number): Promise<UserProfile | null> {
    return this.prisma.userProfile.findUnique({
      where: {
        userId,
      },
    });
  }

  async getProfileIdByUserId(userId: number): Promise<number | null> {
    const profile = await this.prisma.userProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!profile) {
      return null;
    }

    return profile.id;
  }

  async getAllRegisteredUsersCount(): Promise<number> {
    return this.prisma.user.count();
  }

  async getProfileById(id: number): Promise<UserProfile | null> {
    return this.prisma.userProfile.findUnique({
      where: { id },
    });
  }

  async updateAccountType(
    profileId: number,
    accountType: string,
    tx?: any,
  ): Promise<UserProfile> {
    const client = tx || this.prisma;

    return client.userProfile.update({
      where: { id: profileId },
      data: {
        accountType,
        profileUpdatedAt: new Date(),
      },
    });
  }

  async isUserBlocked(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isBlocked: true,
        deletedAt: true,
      },
    });

    if (!user) {
      return false;
    }

    return user.isBlocked === true || user.deletedAt !== null;
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
