import { Injectable } from '@nestjs/common';
import { PrismaService } from '@super-admin/prisma/prisma.service';
import { User } from '../domain/schema/user.schema';
import { UserProfile } from '../domain/schema/user-profile.schema';
import { PaginatedUserResponse } from '../domain/schema/paginated-user.entity';
import { AccountType } from '../domain/schema/account-type.enum';
import { SortDirection } from '@super-admin/core/schema/sort-direction.enum';
import { AppLoggerService } from '@libs/logger/logger.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async getUser(id: number): Promise<User | null> {
    try {
      const prismaUser = await this.prisma.user.findUnique({
        where: { id },
        include: {
          profile: true,
        },
      });

      if (!prismaUser) {
        return null;
      }

      const user = this.mapToUser(prismaUser);
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to get user by id: ${id}`,
        error?.stack,
        UserService.name,
      );
      return null;
    }
  }

  async getUsers(
    pageNumber: number = 1,
    pageSize: number = 10,
    sortDirection: SortDirection = SortDirection.ASC,
  ): Promise<PaginatedUserResponse> {
    try {
      const skip = (pageNumber - 1) * pageSize;

      if (skip < 0 || isNaN(skip)) {
        this.logger.error(
          `Invalid skip calculation: pageNumber=${pageNumber}, pageSize=${pageSize}, skip=${skip}`,
          this.getUsers.name,
          UserService.name,
        );
      }

      const [users, totalCount] = await Promise.all([
        this.prisma.user.findMany({
          skip,
          take: pageSize,
          orderBy: {
            id: sortDirection === 'ASC' ? 'asc' : 'desc',
          },
          include: {
            profile: true,
          },
        }),
        this.prisma.user.count(),
      ]);

      const pagesCount = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;

      const result: PaginatedUserResponse = {
        page: pageNumber,
        pageSize: pageSize,
        pagesCount: pagesCount,
        totalCount: totalCount,
        items: users.map((user) => this.mapToUser(user)),
      };

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get users: pageNumber=${pageNumber}, pageSize=${pageSize}, sortDirection=${sortDirection}`,
        error?.stack,
        UserService.name,
      );

      return {
        page: pageNumber,
        pageSize: pageSize,
        pagesCount: 0,
        totalCount: 0,
        items: [],
      };
    }
  }

  private mapToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      username: prismaUser.username,
      email: prismaUser.email,
      createdAt: prismaUser.createdAt,
      profile: prismaUser.profile
        ? this.mapToUserProfile(prismaUser.profile)
        : undefined,
    };
  }

  private mapToUserProfile(prismaProfile: any): UserProfile {
    return {
      id: prismaProfile.id,
      firstName: prismaProfile.firstName || undefined,
      lastName: prismaProfile.lastName || undefined,
      dateOfBirth: prismaProfile.dateOfBirth || undefined,
      country: prismaProfile.country || undefined,
      city: prismaProfile.city || undefined,
      aboutMe: prismaProfile.aboutMe || undefined,
      avatarUrl: prismaProfile.avatarUrl || undefined,
      profileFilled: prismaProfile.profileFilled || false,
      profileFilledAt: prismaProfile.profileFilledAt || undefined,
      profileUpdatedAt: prismaProfile.profileUpdatedAt || undefined,
      accountType:
        (prismaProfile.accountType as AccountType) || AccountType.PERSONAL,
    };
  }
}
