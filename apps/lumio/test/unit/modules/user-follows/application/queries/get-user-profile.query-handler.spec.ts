import { Test, TestingModule } from '@nestjs/testing';
import {
  GetUserProfileQueryHandler,
  GetUserProfileQuery,
} from '@lumio/modules/user-follows/application/queries/get-user-profile.query-handler';
import { UserFollowQueryRepository } from '@lumio/modules/user-follows/domain/infrastructure/user-follow.query-repository';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { ExternalQueryPostsRepository } from '@lumio/modules/posts/domain/infrastructure/post.external-query.repository';
import { UserProfileViewDto } from '@lumio/modules/user-follows/api/dto/output/user-profile.view-dto';

describe('GetUserProfileQueryHandler', () => {
  let handler: GetUserProfileQueryHandler;
  let userFollowQueryRepository: jest.Mocked<UserFollowQueryRepository>;
  let externalQueryUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;
  let externalQueryPostsRepository: jest.Mocked<ExternalQueryPostsRepository>;

  beforeEach(async () => {
    const mockUserFollowQueryRepository = {
      isFollowing: jest.fn(),
    };

    const mockExternalQueryUserRepository = {
      getUserInfo: jest.fn(),
      getProfileByUserId: jest.fn(),
    };

    const mockExternalQueryPostsRepository = {
      getPostsCountByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserProfileQueryHandler,
        {
          provide: UserFollowQueryRepository,
          useValue: mockUserFollowQueryRepository,
        },
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: mockExternalQueryUserRepository,
        },
        {
          provide: ExternalQueryPostsRepository,
          useValue: mockExternalQueryPostsRepository,
        },
      ],
    }).compile();

    handler = module.get<GetUserProfileQueryHandler>(
      GetUserProfileQueryHandler,
    );
    userFollowQueryRepository = module.get(UserFollowQueryRepository);
    externalQueryUserRepository = module.get(
      ExternalQueryUserAccountsRepository,
    );
    externalQueryPostsRepository = module.get(ExternalQueryPostsRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return user profile for another user', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const query = new GetUserProfileQuery(currentUserId, targetUserId);

      const mockUser = {
        id: 2,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        isBlocked: false,
      };
      const mockProfile = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        country: 'US',
        city: 'New York',
        aboutMe: 'Software developer',
        avatarUrl: 'https://example.com/avatar.jpg',
        profileFilled: true,
        profileFilledAt: new Date('2024-01-01'),
        profileUpdatedAt: new Date('2024-01-01'),
        followersCount: 10,
        followingCount: 5,
        accountType: 'Personal',
        userId: 2,
      };
      const postsCount = 15;

      externalQueryUserRepository.getUserInfo.mockResolvedValue(mockUser);
      externalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      externalQueryPostsRepository.getPostsCountByUserId.mockResolvedValue(
        postsCount,
      );
      userFollowQueryRepository.isFollowing.mockResolvedValue(true);

      const result = await handler.execute(query);

      expect(result).toBeInstanceOf(UserProfileViewDto);
      expect(result.id).toBe(2);
      expect(result.username).toBe('testuser');
      expect(result.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(result.aboutMe).toBe('Software developer');
      expect(result.followersCount).toBe(10);
      expect(result.followingCount).toBe(5);
      expect(result.postsCount).toBe(15);
      expect(result.isFollowing).toBe(true);
      expect(result.isCurrentUser).toBe(false);

      expect(externalQueryUserRepository.getUserInfo).toHaveBeenCalledWith(
        targetUserId,
      );
      expect(
        externalQueryUserRepository.getProfileByUserId,
      ).toHaveBeenCalledWith(targetUserId);
      expect(
        externalQueryPostsRepository.getPostsCountByUserId,
      ).toHaveBeenCalledWith(targetUserId);
      expect(userFollowQueryRepository.isFollowing).toHaveBeenCalledWith(
        currentUserId,
        targetUserId,
      );
    });

    it('should return own profile with isCurrentUser=true', async () => {
      const currentUserId = 1;
      const targetUserId = 1;
      const query = new GetUserProfileQuery(currentUserId, targetUserId);

      const mockUser = {
        id: 1,
        username: 'currentuser',
        email: 'current@example.com',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        isBlocked: false,
      };
      const mockProfile = {
        id: 1,
        firstName: null,
        lastName: null,
        dateOfBirth: null,
        country: null,
        city: null,
        aboutMe: null,
        avatarUrl: null,
        profileFilled: false,
        profileFilledAt: null,
        profileUpdatedAt: null,
        followersCount: 20,
        followingCount: 10,
        accountType: 'Personal',
        userId: 1,
      };
      const postsCount = 5;

      externalQueryUserRepository.getUserInfo.mockResolvedValue(mockUser);
      externalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      externalQueryPostsRepository.getPostsCountByUserId.mockResolvedValue(
        postsCount,
      );
      userFollowQueryRepository.isFollowing.mockResolvedValue(false);

      const result = await handler.execute(query);

      expect(result.isCurrentUser).toBe(true);
      expect(result.isFollowing).toBe(false);
      expect(result.followersCount).toBe(20);
      expect(result.followingCount).toBe(10);
      expect(result.postsCount).toBe(5);
    });

    it('should throw when user not found', async () => {
      const currentUserId = 1;
      const targetUserId = 999;
      const query = new GetUserProfileQuery(currentUserId, targetUserId);

      externalQueryUserRepository.getUserInfo.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow('Not Found');
      expect(externalQueryUserRepository.getUserInfo).toHaveBeenCalledWith(
        targetUserId,
      );
      expect(
        externalQueryUserRepository.getProfileByUserId,
      ).not.toHaveBeenCalled();
    });

    it('should throw when profile not found', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const query = new GetUserProfileQuery(currentUserId, targetUserId);

      const mockUser = {
        id: 2,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        isBlocked: false,
      };

      externalQueryUserRepository.getUserInfo.mockResolvedValue(mockUser);
      externalQueryUserRepository.getProfileByUserId.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow('Not Found');
      expect(
        externalQueryUserRepository.getProfileByUserId,
      ).toHaveBeenCalledWith(targetUserId);
    });

    it('should handle user with no posts', async () => {
      const currentUserId = 1;
      const targetUserId = 2;
      const query = new GetUserProfileQuery(currentUserId, targetUserId);

      const mockUser = {
        id: 2,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        isBlocked: false,
      };
      const mockProfile = {
        id: 2,
        firstName: null,
        lastName: null,
        dateOfBirth: null,
        country: null,
        city: null,
        aboutMe: null,
        avatarUrl: null,
        profileFilled: false,
        profileFilledAt: null,
        profileUpdatedAt: null,
        followersCount: 0,
        followingCount: 0,
        accountType: 'Personal',
        userId: 2,
      };

      externalQueryUserRepository.getUserInfo.mockResolvedValue(mockUser);
      externalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      externalQueryPostsRepository.getPostsCountByUserId.mockResolvedValue(0);
      userFollowQueryRepository.isFollowing.mockResolvedValue(false);

      const result = await handler.execute(query);

      expect(result.postsCount).toBe(0);
      expect(result.followersCount).toBe(0);
      expect(result.followingCount).toBe(0);
      expect(result.isFollowing).toBe(false);
    });
  });
});
