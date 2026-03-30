import { Injectable } from '@nestjs/common';
import { PrismaService } from '@super-admin/prisma/prisma.service';
import { UserWithProfileOutputDto } from '@super-admin/modules/users/api/dto/output/user-with-profile.output.dto';
import { FindManyOptionsInputDto } from '@super-admin/modules/users/api/dto/input/find-many-options.input.dto';
import { UserSortBy } from '@super-admin/core/schema/user-sort-by.enum';
import { UserBlockedFilter } from '@super-admin/core/schema/user-blocked-filter.enum';

@Injectable()
export class UserQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<UserWithProfileOutputDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return null;
    }

    return this.mapToDto(user);
  }

  async findByProfileIds(
    profileIds: number[],
  ): Promise<UserWithProfileOutputDto[]> {
    if (profileIds.length === 0) {
      return [];
    }

    // Убираем дубликаты
    const uniqueProfileIds = [...new Set(profileIds)];

    const users = await this.prisma.user.findMany({
      where: {
        profile: {
          id: { in: uniqueProfileIds },
        },
        deletedAt: null,
      },
      include: {
        profile: true,
      },
    });

    return users.map((user) => this.mapToDto(user));
  }

  async findByIds(ids: number[]): Promise<UserWithProfileOutputDto[]> {
    if (ids.length === 0) {
      return [];
    }

    // Убираем дубликаты
    const uniqueIds = [...new Set(ids)];

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: uniqueIds },
        deletedAt: null,
      },
      include: {
        profile: true,
      },
    });

    return users.map((user) => this.mapToDto(user));
  }

  async findMany(
    options: FindManyOptionsInputDto,
  ): Promise<UserWithProfileOutputDto[]> {
    const where: any = {
      deletedAt: null,
    };

    if (options.search) {
      where.username = {
        contains: options.search,
        mode: 'insensitive',
      };
    }

    if (options.blockedFilter) {
      if (options.blockedFilter === UserBlockedFilter.BLOCKED) {
        where.isBlocked = true;
      } else if (options.blockedFilter === UserBlockedFilter.NOT_BLOCKED) {
        where.isBlocked = false;
      }
    }

    let orderBy: any = { createdAt: 'desc' };

    if (options.sortBy) {
      switch (options.sortBy) {
        case UserSortBy.USERNAME_ASC:
          orderBy = { username: 'asc' };
          break;
        case UserSortBy.USERNAME_DESC:
          orderBy = { username: 'desc' };
          break;
        case UserSortBy.CREATED_AT_ASC:
          orderBy = { createdAt: 'asc' };
          break;
        case UserSortBy.CREATED_AT_DESC:
          orderBy = { createdAt: 'desc' };
          break;
      }
    }

    const users = await this.prisma.user.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy,
      include: {
        profile: true,
      },
    });

    return users.map((user) => this.mapToDto(user));
  }

  async count(options?: FindManyOptionsInputDto): Promise<number> {
    const where: any = {
      deletedAt: null,
    };

    if (options?.search) {
      where.username = {
        contains: options.search,
        mode: 'insensitive',
      };
    }

    if (options?.blockedFilter) {
      if (options.blockedFilter === UserBlockedFilter.BLOCKED) {
        where.isBlocked = true;
      } else if (options.blockedFilter === UserBlockedFilter.NOT_BLOCKED) {
        where.isBlocked = false;
      }
    }

    return this.prisma.user.count({ where });
  }

  private mapToDto(user: any): UserWithProfileOutputDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      isBlocked: user.isBlocked,
      bannedAt: user.bannedAt || undefined,
      banReason: user.banReason || undefined,
      profile: user.profile
        ? {
            id: user.profile.id,
            firstName: user.profile.firstName || undefined,
            lastName: user.profile.lastName || undefined,
            dateOfBirth: user.profile.dateOfBirth || undefined,
            country: user.profile.country || undefined,
            city: user.profile.city || undefined,
            aboutMe: user.profile.aboutMe || undefined,
            avatarUrl: user.profile.avatarUrl || undefined,
            profileFilled: user.profile.profileFilled || false,
            profileFilledAt: user.profile.profileFilledAt || undefined,
            profileUpdatedAt: user.profile.profileUpdatedAt || undefined,
            accountType: user.profile.accountType,
          }
        : undefined,
    };
  }
}
