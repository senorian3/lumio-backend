import { UserMapper } from '@super-admin/modules/users/application/mappers/user.mapper';
import { UserWithProfileOutputDto } from '@super-admin/modules/users/api/dto/output/user-with-profile.output.dto';
import { AccountType } from '@super-admin/modules/users/domain/schema/user/account-type.enum';

describe('UserMapper', () => {
  let mapper: UserMapper;

  beforeEach(() => {
    mapper = new UserMapper();
  });

  describe('mapFromDto', () => {
    it('should map basic user fields correctly', () => {
      const dto: UserWithProfileOutputDto = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
        isBlocked: false,
      };

      const result = mapper.mapFromDto(dto);

      expect(result.id).toBe(1);
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.createdAt).toEqual(new Date('2024-01-01'));
      expect(result.isBlocked).toBe(false);
      expect(result.bannedAt).toBeUndefined();
      expect(result.banReason).toBeUndefined();
    });

    it('should map blocked user fields correctly', () => {
      const dto: UserWithProfileOutputDto = {
        id: 2,
        username: 'blockeduser',
        email: 'blocked@example.com',
        createdAt: new Date('2024-01-01'),
        isBlocked: true,
        bannedAt: new Date('2024-06-01'),
        banReason: 'Violation of terms',
      };

      const result = mapper.mapFromDto(dto);

      expect(result.isBlocked).toBe(true);
      expect(result.bannedAt).toEqual(new Date('2024-06-01'));
      expect(result.banReason).toBe('Violation of terms');
    });

    it('should map profile fields correctly', () => {
      const dto: UserWithProfileOutputDto = {
        id: 3,
        username: 'userwithprofile',
        email: 'profile@example.com',
        createdAt: new Date('2024-01-01'),
        isBlocked: false,
        profile: {
          id: 100,
          firstName: 'John',
          lastName: 'Doe',
          country: 'USA',
          city: 'New York',
          aboutMe: 'Hello!',
          avatarUrl: 'https://example.com/avatar.jpg',
          profileFilled: true,
          profileFilledAt: new Date('2024-02-01'),
          profileUpdatedAt: new Date('2024-03-01'),
          accountType: AccountType.PERSONAL,
        },
      };

      const result = mapper.mapFromDto(dto);

      expect(result.profile).toBeDefined();
      expect(result.profile!.id).toBe(100);
      expect(result.profile!.firstName).toBe('John');
      expect(result.profile!.lastName).toBe('Doe');
      expect(result.profile!.country).toBe('USA');
      expect(result.profile!.city).toBe('New York');
      expect(result.profile!.aboutMe).toBe('Hello!');
      expect(result.profile!.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(result.profile!.profileFilled).toBe(true);
      expect(result.profile!.accountType).toBe(AccountType.PERSONAL);
    });

    it('should handle missing profile', () => {
      const dto: UserWithProfileOutputDto = {
        id: 4,
        username: 'noprofile',
        email: 'noprofile@example.com',
        createdAt: new Date('2024-01-01'),
        isBlocked: false,
        profile: undefined,
      };

      const result = mapper.mapFromDto(dto);

      expect(result.profile).toBeUndefined();
    });

    it('should default to PERSONAL account type when not provided', () => {
      const dto: UserWithProfileOutputDto = {
        id: 5,
        username: 'defaultaccount',
        email: 'default@example.com',
        createdAt: new Date('2024-01-01'),
        isBlocked: false,
        profile: {
          id: 200,
          profileFilled: false,
          accountType: undefined as any,
        },
      };

      const result = mapper.mapFromDto(dto);

      expect(result.profile!.accountType).toBe(AccountType.PERSONAL);
    });
  });

  describe('mapFromDtoArray', () => {
    it('should map array of users correctly', () => {
      const dtos: UserWithProfileOutputDto[] = [
        {
          id: 1,
          username: 'user1',
          email: 'user1@example.com',
          createdAt: new Date('2024-01-01'),
          isBlocked: false,
        },
        {
          id: 2,
          username: 'user2',
          email: 'user2@example.com',
          createdAt: new Date('2024-01-02'),
          isBlocked: true,
        },
      ];

      const result = mapper.mapFromDtoArray(dtos);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].username).toBe('user1');
      expect(result[1].id).toBe(2);
      expect(result[1].username).toBe('user2');
    });

    it('should return empty array for empty input', () => {
      const result = mapper.mapFromDtoArray([]);

      expect(result).toEqual([]);
    });
  });
});
