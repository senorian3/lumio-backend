import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedUserResponse } from '@super-admin/modules/users/domain/schema/paginated-user.entity';
import { User } from '@super-admin/modules/users/domain/schema/user.schema';
import { UserProfile } from '@super-admin/modules/users/domain/schema/user-profile.schema';
import { AccountType } from '@super-admin/modules/users/domain/schema/account-type.enum';
import { UserQueryRepository } from '@super-admin/modules/users/domain/infrastructure/user.query-repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { SortDirection } from '@super-admin/core/schema/sort-direction.enum';
import { UserSortBy } from '@super-admin/core/schema/user-sort-by.enum';
import { UserWithProfileOutputDto } from '@super-admin/modules/users/api/dto/output/user-with-profile.output.dto';
import {
  FindManyOptionsInputDto,
  SortOrder,
} from '@super-admin/modules/users/api/dto/input/find-many-options.input.dto';

export class GetUsersQuery {
  constructor(
    public readonly pageNumber: number = 1,
    public readonly pageSize: number = 10,
    public readonly sortDirection: SortDirection = SortDirection.ASC,
    public readonly search?: string,
    public readonly sortBy: UserSortBy = UserSortBy.CREATED_AT_DESC,
  ) {}
}

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(
    private readonly userQueryRepository: UserQueryRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(query: GetUsersQuery): Promise<PaginatedUserResponse> {
    try {
      const skip = (query.pageNumber - 1) * query.pageSize;

      // Определяем orderBy на основе sortBy для backward compatibility
      let orderBy: SortOrder =
        query.sortDirection === 'ASC' ? SortOrder.ASC : SortOrder.DESC;

      // Если передан sortBy, определяем orderBy из него
      if (query.sortBy) {
        if (
          query.sortBy === UserSortBy.USERNAME_ASC ||
          query.sortBy === UserSortBy.CREATED_AT_ASC
        ) {
          orderBy = SortOrder.ASC;
        } else {
          orderBy = SortOrder.DESC;
        }
      }

      const findManyOptions: FindManyOptionsInputDto = {
        skip,
        take: query.pageSize,
        orderBy,
        search: query.search,
        sortBy: query.sortBy,
      };

      const [users, totalCount] = await Promise.all([
        this.userQueryRepository.findMany(findManyOptions),
        this.userQueryRepository.count(findManyOptions),
      ]);

      const pagesCount =
        totalCount > 0 ? Math.ceil(totalCount / query.pageSize) : 0;

      return {
        page: query.pageNumber,
        pageSize: query.pageSize,
        pagesCount: pagesCount,
        totalCount: totalCount,
        items: users.map((user) => this.mapFromDto(user)),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get users: pageNumber=${query.pageNumber}, pageSize=${query.pageSize}, sortDirection=${query.sortDirection}, sortBy=${query.sortBy}`,
        error?.stack,
        GetUsersHandler.name,
      );

      return {
        page: query.pageNumber,
        pageSize: query.pageSize,
        pagesCount: 0,
        totalCount: 0,
        items: [],
      };
    }
  }

  private mapFromDto(dto: UserWithProfileOutputDto): User {
    return {
      id: dto.id,
      username: dto.username,
      email: dto.email,
      createdAt: dto.createdAt,
      isBlocked: dto.isBlocked ?? false,
      bannedAt: dto.bannedAt || undefined,
      banReason: dto.banReason || undefined,
      profile: dto.profile ? this.mapProfileFromDto(dto.profile) : undefined,
    };
  }

  private mapProfileFromDto(profileDto: any): UserProfile {
    return {
      id: profileDto.id,
      firstName: profileDto.firstName || undefined,
      lastName: profileDto.lastName || undefined,
      dateOfBirth: profileDto.dateOfBirth || undefined,
      country: profileDto.country || undefined,
      city: profileDto.city || undefined,
      aboutMe: profileDto.aboutMe || undefined,
      avatarUrl: profileDto.avatarUrl || undefined,
      profileFilled: profileDto.profileFilled || false,
      profileFilledAt: profileDto.profileFilledAt || undefined,
      profileUpdatedAt: profileDto.profileUpdatedAt || undefined,
      accountType:
        (profileDto.accountType as AccountType) || AccountType.PERSONAL,
    };
  }
}
