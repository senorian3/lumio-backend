import { Test, TestingModule } from '@nestjs/testing';
import { UserFollowRepository } from '@lumio/modules/user-follows/domain/infrastructure/user-follow.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('UserFollowRepository', () => {
  let repository: UserFollowRepository;

  const mockPrisma = {
    userFollow: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    userProfile: {
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserFollowRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(UserFollowRepository);
    jest.clearAllMocks();
  });

  describe('isAlreadyFollowing', () => {
    it('should return follow record when following exists', async () => {
      const mockFollow = {
        id: 1,
        followerId: 1,
        followingId: 2,
        deletedAt: null,
      };
      mockPrisma.userFollow.findFirst.mockResolvedValue(mockFollow);

      const result = await repository.isAlreadyFollowing(1, 2);

      expect(result).toEqual(mockFollow);
      expect(mockPrisma.userFollow.findFirst).toHaveBeenCalledWith({
        where: { followerId: 1, followingId: 2, deletedAt: null },
      });
    });

    it('should return null when not following', async () => {
      mockPrisma.userFollow.findFirst.mockResolvedValue(null);

      const result = await repository.isAlreadyFollowing(1, 2);

      expect(result).toBeNull();
    });
  });

  describe('createFollow', () => {
    it('should create a new follow record', async () => {
      mockPrisma.userFollow.create.mockResolvedValue({
        id: 1,
        followerId: 1,
        followingId: 2,
      });

      const result = await repository.createFollow(1, 2);

      expect(result).toEqual({ id: 1, followerId: 1, followingId: 2 });
      expect(mockPrisma.userFollow.create).toHaveBeenCalledWith({
        data: { followerId: 1, followingId: 2 },
      });
    });

    it('should use transaction client when provided', async () => {
      const tx = {
        userFollow: { create: jest.fn().mockResolvedValue({ id: 1 }) },
      };

      await repository.createFollow(1, 2, tx);

      expect(tx.userFollow.create).toHaveBeenCalledWith({
        data: { followerId: 1, followingId: 2 },
      });
    });
  });

  describe('deleteFollow', () => {
    it('should delete follow by id', async () => {
      mockPrisma.userFollow.delete.mockResolvedValue({ id: 1 });

      const result = await repository.deleteFollow(1);

      expect(result).toEqual({ id: 1 });
      expect(mockPrisma.userFollow.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should use transaction client when provided', async () => {
      const tx = {
        userFollow: { delete: jest.fn().mockResolvedValue({ id: 1 }) },
      };

      await repository.deleteFollow(1, tx);

      expect(tx.userFollow.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
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

  describe('updateProfileCounters', () => {
    it('should update followers and following counts', async () => {
      mockPrisma.userProfile.update.mockResolvedValue({});

      await repository.updateProfileCounters(1, 1, 0);

      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: {
          followersCount: { increment: 1 },
          followingCount: { increment: 0 },
        },
      });
    });

    it('should use transaction client when provided', async () => {
      const tx = {
        userProfile: { update: jest.fn().mockResolvedValue({}) },
      };

      await repository.updateProfileCounters(1, 1, 0, tx);

      expect(tx.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: {
          followersCount: { increment: 1 },
          followingCount: { increment: 0 },
        },
      });
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

    it('should return empty array when not following anyone', async () => {
      mockPrisma.userFollow.findMany.mockResolvedValue([]);

      const result = await repository.getFollowingIds(1);

      expect(result).toEqual([]);
    });
  });

  describe('checkUserExists', () => {
    it('should return true when user exists and is active', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      const result = await repository.checkUserExists(1);

      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.checkUserExists(999);

      expect(result).toBe(false);
    });
  });

  describe('createFollowWithCounters', () => {
    it('should create follow and update counters in transaction', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          userFollow: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 1, followerId: 1, followingId: 2 }),
          },
          userProfile: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const result = await repository.createFollowWithCounters(1, 2);

      expect(result).toEqual({ id: 1, followerId: 1, followingId: 2 });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('deleteFollowWithCounters', () => {
    it('should delete follow and update counters in transaction', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          userFollow: {
            delete: jest.fn().mockResolvedValue({ id: 1 }),
          },
          userProfile: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const result = await repository.deleteFollowWithCounters(1, 2, 1);

      expect(result).toEqual({ id: 1 });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
