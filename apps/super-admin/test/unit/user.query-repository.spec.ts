import { Test, TestingModule } from '@nestjs/testing';
import { UserQueryRepository } from '@super-admin/modules/users/domain/infrastructure/user.query-repository';
import { PrismaService } from '@super-admin/prisma/prisma.service';
import { UserSortBy } from '@super-admin/core/schema/user-sort-by.enum';
import { UserBlockedFilter } from '@super-admin/core/schema/user-blocked-filter.enum';
import { SortOrder } from '@super-admin/modules/users/api/dto/input/find-many-options.input.dto';

describe('UserQueryRepository', () => {
  let repository: UserQueryRepository;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@test.com',
    createdAt: new Date('2026-01-01'),
    isBlocked: false,
    bannedAt: null,
    banReason: null,
    profile: {
      id: 100,
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: null,
      country: null,
      city: null,
      aboutMe: null,
      avatarUrl: 'avatar.jpg',
      profileFilled: true,
      profileFilledAt: new Date('2026-01-01'),
      profileUpdatedAt: new Date('2026-01-01'),
      accountType: 'personal',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserQueryRepository,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<UserQueryRepository>(UserQueryRepository);
    prisma = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.username).toBe('testuser');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { profile: true },
      });
    });

    it('should return null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByProfileIds', () => {
    it('should find users by profile ids', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await repository.findByProfileIds([100]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          profile: { id: { in: [100] } },
          deletedAt: null,
        },
        include: { profile: true },
      });
    });

    it('should return empty array when profile ids are empty', async () => {
      const result = await repository.findByProfileIds([]);

      expect(result).toEqual([]);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should deduplicate profile ids', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      await repository.findByProfileIds([100, 100, 200]);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            profile: { id: { in: [100, 200] } },
          }),
        }),
      );
    });
  });

  describe('findByIds', () => {
    it('should find users by ids', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await repository.findByIds([1]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [1] },
          deletedAt: null,
        },
        include: { profile: true },
      });
    });

    it('should return empty array when ids are empty', async () => {
      const result = await repository.findByIds([]);

      expect(result).toEqual([]);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findMany', () => {
    it('should find users with default options', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await repository.findMany({
        skip: 0,
        take: 10,
        orderBy: SortOrder.DESC,
        sortBy: undefined,
        search: undefined,
        blockedFilter: undefined,
      });

      expect(result).toHaveLength(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          skip: 0,
          take: 10,
          orderBy: { createdAt: SortOrder.DESC },
        }),
      );
    });

    it('should filter by search query', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await repository.findMany({
        skip: 0,
        take: 10,
        orderBy: SortOrder.DESC,
        sortBy: undefined,
        search: 'john',
        blockedFilter: undefined,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            username: {
              contains: 'john',
              mode: 'insensitive',
            },
          }),
        }),
      );
    });

    it('should filter by BLOCKED status', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await repository.findMany({
        skip: 0,
        take: 10,
        orderBy: SortOrder.DESC,
        sortBy: undefined,
        search: undefined,
        blockedFilter: UserBlockedFilter.BLOCKED,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isBlocked: true,
          }),
        }),
      );
    });

    it('should filter by NOT_BLOCKED status', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await repository.findMany({
        skip: 0,
        take: 10,
        orderBy: SortOrder.DESC,
        sortBy: undefined,
        search: undefined,
        blockedFilter: UserBlockedFilter.NOT_BLOCKED,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isBlocked: false,
          }),
        }),
      );
    });

    it('should sort by USERNAME_ASC', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await repository.findMany({
        skip: 0,
        take: 10,
        orderBy: SortOrder.DESC,
        sortBy: UserSortBy.USERNAME_ASC,
        search: undefined,
        blockedFilter: undefined,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { username: 'asc' },
        }),
      );
    });

    it('should sort by USERNAME_DESC', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await repository.findMany({
        skip: 0,
        take: 10,
        orderBy: SortOrder.DESC,
        sortBy: UserSortBy.USERNAME_DESC,
        search: undefined,
        blockedFilter: undefined,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { username: 'desc' },
        }),
      );
    });

    it('should sort by CREATED_AT_ASC', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await repository.findMany({
        skip: 0,
        take: 10,
        orderBy: SortOrder.DESC,
        sortBy: UserSortBy.CREATED_AT_ASC,
        search: undefined,
        blockedFilter: undefined,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should sort by CREATED_AT_DESC', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await repository.findMany({
        skip: 0,
        take: 10,
        orderBy: SortOrder.DESC,
        sortBy: UserSortBy.CREATED_AT_DESC,
        search: undefined,
        blockedFilter: undefined,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('count', () => {
    it('should count users', async () => {
      prisma.user.count.mockResolvedValue(10);

      const result = await repository.count();

      expect(result).toBe(10);
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });

    it('should count users with search filter', async () => {
      prisma.user.count.mockResolvedValue(1);

      const result = await repository.count({
        skip: 0,
        take: 10,
        orderBy: SortOrder.DESC,
        sortBy: undefined,
        search: 'john',
        blockedFilter: undefined,
      });

      expect(result).toBe(1);
      expect(prisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            username: {
              contains: 'john',
              mode: 'insensitive',
            },
          }),
        }),
      );
    });

    it('should count users with BLOCKED filter', async () => {
      prisma.user.count.mockResolvedValue(5);

      const result = await repository.count({
        skip: 0,
        take: 10,
        orderBy: SortOrder.DESC,
        sortBy: undefined,
        search: undefined,
        blockedFilter: UserBlockedFilter.BLOCKED,
      });

      expect(result).toBe(5);
      expect(prisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isBlocked: true,
          }),
        }),
      );
    });
  });
});
