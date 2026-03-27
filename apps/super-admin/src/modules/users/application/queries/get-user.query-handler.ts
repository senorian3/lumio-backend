import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { User } from '@super-admin/modules/users/domain/schema/user/user.schema';
import { UserProfile } from '@super-admin/modules/users/domain/schema/user/user-profile.schema';
import { AccountType } from '@super-admin/modules/users/domain/schema/user/account-type.enum';
import { UserQueryRepository } from '@super-admin/modules/users/domain/infrastructure/user.query-repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { UserWithProfileOutputDto } from '@super-admin/modules/users/api/dto/output/user-with-profile.output.dto';

export class GetUserQuery {
  constructor(public readonly id: number) {}
}

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    private readonly userQueryRepository: UserQueryRepository,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(query: GetUserQuery): Promise<User | null> {
    try {
      const userDto = await this.userQueryRepository.findById(query.id);

      if (!userDto) {
        return null;
      }

      const user = this.mapFromDto(userDto);
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to get user by id: ${query.id}`,
        error?.stack,
        GetUserHandler.name,
      );
      return null;
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
