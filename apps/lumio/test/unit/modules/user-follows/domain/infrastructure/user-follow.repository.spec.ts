import { Test, TestingModule } from '@nestjs/testing';
import { UserFollowRepository } from '@lumio/modules/user-follows/domain/infrastructure/user-follow.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';
import {
  BadRequestDomainException,
  NotFoundDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';

describe('UserFollowRepository', () => {
  let repository: UserFollowRepository;

  const mockPrisma = {
    userFollow: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userProfile: {
      update: jest.fn(),
      findUnique: jest.fn(),
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

  describe('createFollow', () => {
    it('should throw when trying to follow yourself', async () => {
      await expect(repository.createFollow(1, 1)).rejects.toThrow(
        BadRequestDomainException,
      );
    });

    it('should throw when already following', async () => {
      mockPrisma.userFollow.findFirst.mockResolvedValueOnce({
        id: 1,
        followerId: 1,
        followingId: 2,
        deletedAt: null,
      });

      await expect(repository.createFollow(1, 2)).rejects.toThrow(
        BadRequestDomainException,
      );
    });

    it('should restore soft-deleted follow', async () => {
      mockPrisma.userFollow.findFirst
        .mockResolvedValueOnce(null) // no active follow
        .mockResolvedValueOnce({ id: 1, deletedAt: new Date() }); // soft-deleted follow exists
      mockPrisma.userFollow.update.mockResolvedValue({
        id: 1,
        deletedAt: null,
      });

      const result = await repository.createFollow(1, 2);

      expect(result).toEqual({ id: 1, deletedAt: null });
      expect(mockPrisma.userFollow.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: null },
      });
    });

    it('should create a new follow', async () => {
      mockPrisma.userFollow.findFirst
        .mockResolvedValueOnce(null) // no active follow
        .mockResolvedValueOnce(null); // no soft-deleted follow
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
  });

  describe('deleteFollow', () => {
    it('should throw when not following', async () => {
      mockPrisma.userFollow.findFirst.mockResolvedValue(null);

      await expect(repository.deleteFollow(1, 2)).rejects.toThrow(
        BadRequestDomainException,
      );
    });

    it('should soft-delete follow', async () => {
      mockPrisma.userFollow.findFirst.mockResolvedValue({
        id: 1,
        followerId: 1,
        followingId: 2,
        deletedAt: null,
      });
      mockPrisma.userFollow.update.mockResolvedValue({
        id: 1,
        deletedAt: new Date(),
      });

      const result = await repository.deleteFollow(1, 2);

      expect(result).toEqual({ id: 1, deletedAt: expect.any(Date) });
      expect(mockPrisma.userFollow.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
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

  describe('getUser', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 1, username: 'test' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.getUser(1);

      expect(result).toEqual(mockUser);
    });

    it('should throw when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(repository.getUser(999)).rejects.toThrow(
        NotFoundDomainException,
      );
    });
  });

  describe('getUserProfileWithFilledCheck', () => {
    it('should return profile when filled', async () => {
      const mockProfile = { profileFilled: true, userId: 1 };
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await repository.getUserProfileWithFilledCheck(1);

      expect(result).toEqual(mockProfile);
    });

    it('should throw when profile not found', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      await expect(repository.getUserProfileWithFilledCheck(1)).rejects.toThrow(
        ForbiddenDomainException,
      );
    });

    it('should throw when profile not filled', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        profileFilled: false,
        userId: 1,
      });

      await expect(repository.getUserProfileWithFilledCheck(1)).rejects.toThrow(
        ForbiddenDomainException,
      );
    });
  });

  describe('createFollowWithCounters', () => {
    it('should create follow and update counters in transaction', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          userFollow: {
            findFirst: jest
              .fn()
              .mockResolvedValueOnce(null)
              .mockResolvedValueOnce(null),
            create: jest
              .fn()
              .mockResolvedValue({ id: 1, followerId: 1, followingId: 2 }),
            update: jest.fn(),
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
            findFirst: jest
              .fn()
              .mockResolvedValue({ id: 1, followerId: 1, followingId: 2 }),
            update: jest
              .fn()
              .mockResolvedValue({ id: 1, deletedAt: new Date() }),
          },
          userProfile: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const result = await repository.deleteFollowWithCounters(1, 2);

      expect(result).toEqual({ id: 1, deletedAt: expect.any(Date) });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
