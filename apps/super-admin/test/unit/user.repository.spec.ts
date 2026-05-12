import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '@super-admin/modules/users/domain/infrastructure/user.repository';
import { PrismaService } from '@super-admin/prisma/prisma.service';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@test.com',
    createdAt: new Date('2026-01-01'),
    deletedAt: null,
    isBlocked: false,
    bannedAt: null,
    banReason: null,
    profile: {
      id: 100,
      firstName: 'Test',
      lastName: 'User',
      accountType: 'personal',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
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
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
          deletedAt: null,
        },
        include: { profile: true },
      });
    });

    it('should return null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should find users with options', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await repository.findMany({
        skip: 0,
        take: 10,
        orderBy: 'asc',
      });

      expect(result).toHaveLength(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { id: 'asc' },
        include: { profile: true },
      });
    });
  });

  describe('count', () => {
    it('should count all users', async () => {
      prisma.user.count.mockResolvedValue(10);

      const result = await repository.count();

      expect(result).toBe(10);
      expect(prisma.user.count).toHaveBeenCalled();
    });
  });

  describe('softDeletedUserById', () => {
    it('should soft delete user by id', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await repository.softDeletedUserById(1);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          deletedAt: expect.any(Date),
        },
      });
    });
  });

  describe('updateBanStatus', () => {
    it('should update ban status', async () => {
      const banUserDto = {
        isBlocked: true,
        bannedAt: new Date('2026-01-01'),
        banReason: 'Violation of terms',
      };

      prisma.user.update.mockResolvedValue({ ...mockUser, ...banUserDto });

      await repository.updateBanStatus(1, banUserDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: banUserDto,
      });
    });

    it('should unban user', async () => {
      const unbanUserDto = {
        isBlocked: false,
        bannedAt: null,
        banReason: null,
      };

      prisma.user.update.mockResolvedValue({ ...mockUser, ...unbanUserDto });

      await repository.updateBanStatus(1, unbanUserDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: unbanUserDto,
      });
    });
  });
});
