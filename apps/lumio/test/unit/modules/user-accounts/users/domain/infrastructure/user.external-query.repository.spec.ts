import { Test, TestingModule } from '@nestjs/testing';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('ExternalQueryUserAccountsRepository', () => {
  let repository: ExternalQueryUserAccountsRepository;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalQueryUserAccountsRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(ExternalQueryUserAccountsRepository);
    jest.clearAllMocks();
  });

  describe('findUserId', () => {
    it('should return user id when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      const result = await repository.findUserId(1);

      expect(result).toBe(1);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findUserId(999);

      expect(result).toBeNull();
    });
  });

  describe('getUserInfo', () => {
    it('should return user info', async () => {
      const mockUser = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        createdAt: new Date(),
        isBlocked: false,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.getUserInfo(1);

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.getUserInfo(999);

      expect(result).toBeNull();
    });
  });

  describe('getProfileByUserId', () => {
    it('should return profile by user id', async () => {
      const mockProfile = { id: 1, userId: 1, firstName: 'John' };
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await repository.getProfileByUserId(1);

      expect(result).toEqual(mockProfile);
    });

    it('should return null when profile not found', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      const result = await repository.getProfileByUserId(999);

      expect(result).toBeNull();
    });
  });

  describe('getProfileIdByUserId', () => {
    it('should return profile id when profile exists', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue({ id: 5, userId: 1 });

      const result = await repository.getProfileIdByUserId(1);

      expect(result).toBe(5);
    });

    it('should return null when profile does not exist', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      const result = await repository.getProfileIdByUserId(999);

      expect(result).toBeNull();
    });
  });

  describe('getAllRegisteredUsersCount', () => {
    it('should return total user count', async () => {
      mockPrisma.user.count.mockResolvedValue(100);

      const result = await repository.getAllRegisteredUsersCount();

      expect(result).toBe(100);
    });
  });

  describe('getProfileById', () => {
    it('should return profile by id', async () => {
      const mockProfile = { id: 1, userId: 1 };
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await repository.getProfileById(1);

      expect(result).toEqual(mockProfile);
    });

    it('should return null when profile not found', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      const result = await repository.getProfileById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateAccountType', () => {
    it('should update account type', async () => {
      const mockProfile = { id: 1, accountType: 'Business' };
      mockPrisma.userProfile.update.mockResolvedValue(mockProfile);

      const result = await repository.updateAccountType(1, 'Business');

      expect(result).toEqual(mockProfile);
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { accountType: 'Business', profileUpdatedAt: expect.any(Date) },
      });
    });

    it('should use transaction client when provided', async () => {
      const tx = {
        userProfile: {
          update: jest
            .fn()
            .mockResolvedValue({ id: 1, accountType: 'Business' }),
        },
      };

      const result = await repository.updateAccountType(1, 'Business', tx);

      expect(result).toEqual({ id: 1, accountType: 'Business' });
      expect(mockPrisma.userProfile.update).not.toHaveBeenCalled();
    });
  });

  describe('isUserBlocked', () => {
    it('should return true when user is blocked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        isBlocked: true,
        deletedAt: null,
      });

      const result = await repository.isUserBlocked(1);

      expect(result).toBe(true);
    });

    it('should return true when user is deleted', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        isBlocked: false,
        deletedAt: new Date(),
      });

      const result = await repository.isUserBlocked(1);

      expect(result).toBe(true);
    });

    it('should return false when user is active', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        isBlocked: false,
        deletedAt: null,
      });

      const result = await repository.isUserBlocked(1);

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.isUserBlocked(999);

      expect(result).toBe(false);
    });
  });
});
