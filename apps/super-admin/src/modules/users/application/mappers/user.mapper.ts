import { User } from '@super-admin/modules/users/domain/schema/user/user.schema';
import { UserProfile } from '@super-admin/modules/users/domain/schema/user/user-profile.schema';
import { AccountType } from '@super-admin/modules/users/domain/schema/user/account-type.enum';
import { UserWithProfileOutputDto } from '@super-admin/modules/users/api/dto/output/user-with-profile.output.dto';

export class UserMapper {
  mapFromDto(dto: UserWithProfileOutputDto): User {
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

  mapFromDtoArray(dtos: UserWithProfileOutputDto[]): User[] {
    return dtos.map((dto) => this.mapFromDto(dto));
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
