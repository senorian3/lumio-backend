import { Test, TestingModule } from '@nestjs/testing';
import { UserFollowQueryRepository } from '@lumio/modules/user-follows/domain/infrastructure/user-follow.query-repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('UserFollowQueryRepository', () => {
  let repository: UserFollowQueryRepository;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
    },
    userFollow: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    post: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserFollowQueryRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(UserFollowQueryRepository);
    jest.clearAllMocks();
  });

  describe('searchUsers', () => {
    it('should search users by username', async () => {
      const mockUsers = [
        {
          id: 2,
          username: 'testuser',
          email: 'test@test.com',
          profile: { firstName: 'Test', lastName: 'User', avatarUrl: null },
        },
      ];
      mockPrisma.userFollow.findMany.mockResolvedValue([{ followingId: 2 }]);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await repository.searchUsers(1, {
        username: 'test',
        pageNumber: 1,
        pageSize: 10,
        calculateSkip: () => 0,
      } as any);

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.pagesCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should return empty array when no users match', async () => {
      mockPrisma.userFollow.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await repository.searchUsers(1, {
        username: 'nonexistent',
        pageNumber: 1,
        pageSize: 10,
        calculateSkip: () => 0,
      } as any);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 2,
        username: 'testuser',
        email: 'test@test.com',
        createdAt: new Date(),
        isBlocked: false,
      };
      const mockProfile = {
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        aboutMe: null,
        followersCount: 5,
        followingCount: 3,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.post.count.mockResolvedValue(10);
      mockPrisma.userFollow.findFirst.mockResolvedValue({ id: 1 });

      const result = await repository.getUserProfile(1, 2);

      expect(result).toBeDefined();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 2, deletedAt: null, isBlocked: false },
      });
    });

    it('should throw when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(repository.getUserProfile(1, 999)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getFollowingIds', () => {
    it('should return list of following user ids', async () => {
      mockPrisma.userFollow.findMany.mockResolvedValue([
        { followingId: 2 },
        { followingId: 3 },
      ]);

      const result = await repository.getFollowingIds(1);

      expect(result).toEqual([2, 3]);
    });
  });

  describe('isFollowing', () => {
    it('should return true when following', async () => {
      mockPrisma.userFollow.findFirst.mockResolvedValue({ id: 1 });

      const result = await repository.isFollowing(1, 2);

      expect(result).toBe(true);
    });

    it('should return false when not following', async () => {
      mockPrisma.userFollow.findFirst.mockResolvedValue(null);

      const result = await repository.isFollowing(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('getProfileCounters', () => {
    it('should return profile counters', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        followersCount: 10,
        followingCount: 5,
      });

      const result = await repository.getProfileCounters(1);

      expect(result).toEqual({ followersCount: 10, followingCount: 5 });
    });

    it('should return zeros when profile not found', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      const result = await repository.getProfileCounters(1);

      expect(result).toEqual({ followersCount: 0, followingCount: 0 });
    });
  });

  describe('getFollowers', () => {
    it('should return paginated followers', async () => {
      const mockFollows = [
        {
          id: 1,
          follower: {
            id: 2,
            username: 'follower1',
            profile: { firstName: 'F', lastName: '1', avatarUrl: null },
          },
        },
      ];
      mockPrisma.userFollow.findMany.mockResolvedValue(mockFollows);
      mockPrisma.userFollow.count.mockResolvedValue(1);

      const result = await repository.getFollowers(1, 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should return empty array when no followers', async () => {
      mockPrisma.userFollow.findMany.mockResolvedValue([]);
      mockPrisma.userFollow.count.mockResolvedValue(0);

      const result = await repository.getFollowers(1, 1, 10);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getFollowing', () => {
    it('should return paginated following', async () => {
      const mockFollows = [
        {
          id: 1,
          following: {
            id: 2,
            username: 'following1',
            profile: { firstName: 'F', lastName: '1', avatarUrl: null },
          },
        },
      ];
      mockPrisma.userFollow.findMany.mockResolvedValue(mockFollows);
      mockPrisma.userFollow.count.mockResolvedValue(1);

      const result = await repository.getFollowing(1, 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should return empty array when not following anyone', async () => {
      mockPrisma.userFollow.findMany.mockResolvedValue([]);
      mockPrisma.userFollow.count.mockResolvedValue(0);

      const result = await repository.getFollowing(1, 1, 10);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });
});
