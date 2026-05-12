import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('UserRepository', () => {
  let repository: UserRepository;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    emailConfirmation: {
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    userProfile: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    yandex: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(UserRepository);
    jest.clearAllMocks();
  });

  describe('doesExistByUsernameOrEmail', () => {
    it('should find user by username or email', async () => {
      const mockUser = { id: 1, username: 'test', email: 'test@test.com' };
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await repository.doesExistByUsernameOrEmail(
        'test',
        'test@test.com',
      );

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: 'test', deletedAt: null },
            { email: 'test@test.com', deletedAt: null },
          ],
        },
      });
    });

    it('should return null when user does not exist', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.doesExistByUsernameOrEmail(
        'unknown',
        'unknown@test.com',
      );

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user with email confirmation', async () => {
      const dto = { username: 'test', email: 'test@test.com' };
      const passwordHash = 'hashed-password';
      const mockUser = {
        id: 1,
        ...dto,
        emailConfirmation: { isConfirmed: false },
      };
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await repository.createUser(dto as any, passwordHash);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: 'test',
            email: 'test@test.com',
            password: passwordHash,
          }),
        }),
      );
    });

    it('should use transaction client when provided', async () => {
      const dto = { username: 'test', email: 'test@test.com' };
      const tx = { user: { create: jest.fn().mockResolvedValue({ id: 1 }) } };

      await repository.createUser(dto as any, 'hash', false, tx);

      expect(tx.user.create).toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findByCodeOrIdEmailConfirmation', () => {
    it('should find email confirmation by code', async () => {
      const mockConfirmation = {
        confirmationCode: 'code-123',
        userId: 1,
        user: { id: 1 },
      };
      mockPrisma.emailConfirmation.findFirst.mockResolvedValue(
        mockConfirmation,
      );

      const result = await repository.findByCodeOrIdEmailConfirmation({
        code: 'code-123',
      });

      expect(result).toEqual(mockConfirmation);
    });

    it('should find email confirmation by userId', async () => {
      const mockConfirmation = {
        confirmationCode: 'code-123',
        userId: 1,
        user: { id: 1 },
      };
      mockPrisma.emailConfirmation.findFirst.mockResolvedValue(
        mockConfirmation,
      );

      const result = await repository.findByCodeOrIdEmailConfirmation({
        userId: 1,
      });

      expect(result).toEqual(mockConfirmation);
    });

    it('should return null when no code or userId provided', async () => {
      const result = await repository.findByCodeOrIdEmailConfirmation({});

      expect(result).toBeNull();
      expect(mockPrisma.emailConfirmation.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = { id: 1, email: 'test@test.com', emailConfirmation: {} };
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await repository.findUserByEmail('test@test.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.findUserByEmail('unknown@test.com');

      expect(result).toBeNull();
    });
  });

  describe('updateCodeAndExpirationDate', () => {
    it('should update confirmation code and expiration date', async () => {
      const newDate = new Date();
      mockPrisma.emailConfirmation.update.mockResolvedValue({});

      await repository.updateCodeAndExpirationDate(1, 'new-code', newDate);

      expect(mockPrisma.emailConfirmation.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: {
          confirmationCode: 'new-code',
          expirationDate: newDate,
          isConfirmed: false,
        },
      });
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await repository.updatePassword(1, 'new-hash');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: 'new-hash' },
      });
    });

    it('should use transaction client when provided', async () => {
      const tx = { user: { update: jest.fn().mockResolvedValue({}) } };

      await repository.updatePassword(1, 'new-hash', tx);

      expect(tx.user.update).toHaveBeenCalled();
    });
  });

  describe('findUserById', () => {
    it('should find user by id', async () => {
      const mockUser = { id: 1, emailConfirmation: {}, sessions: [] };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findUserById(1);

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findUserById(999);

      expect(result).toBeNull();
    });
  });

  describe('confirmEmail', () => {
    it('should confirm email', async () => {
      mockPrisma.emailConfirmation.update.mockResolvedValue({});

      await repository.confirmEmail(1);

      expect(mockPrisma.emailConfirmation.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { isConfirmed: true },
      });
    });
  });

  describe('deleteExpiredUserRegistration', () => {
    it('should delete expired unconfirmed users', async () => {
      const date = new Date();
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
            deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          emailConfirmation: {
            deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return cb(tx);
      });

      await repository.deleteExpiredUserRegistration(date);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should handle no expired users', async () => {
      const date = new Date();
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            findMany: jest.fn().mockResolvedValue([]),
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          emailConfirmation: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return cb(tx);
      });

      await repository.deleteExpiredUserRegistration(date);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findYandexByYandexId', () => {
    it('should find yandex account by yandexId', async () => {
      const mockYandex = { yandexId: 'yandex-123', user: { id: 1 } };
      mockPrisma.yandex.findUnique.mockResolvedValue(mockYandex);

      const result = await repository.findYandexByYandexId('yandex-123');

      expect(result).toEqual(mockYandex);
    });

    it('should return null when yandex account not found', async () => {
      mockPrisma.yandex.findUnique.mockResolvedValue(null);

      const result = await repository.findYandexByYandexId('unknown');

      expect(result).toBeNull();
    });
  });

  describe('createYandex', () => {
    it('should create yandex account', async () => {
      const data = {
        yandexId: 'yandex-123',
        email: 'test@test.com',
        username: 'test',
        userId: 1,
      };
      mockPrisma.yandex.create.mockResolvedValue({ id: 1, ...data });

      const result = await repository.createYandex(data);

      expect(result).toEqual({ id: 1, ...data });
    });
  });

  describe('updateYandex', () => {
    it('should update yandex account', async () => {
      mockPrisma.yandex.update.mockResolvedValue({});

      await repository.updateYandex(1, { email: 'new@test.com' });

      expect(mockPrisma.yandex.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { email: 'new@test.com' },
      });
    });
  });

  describe('fillProfile', () => {
    it('should create user profile', async () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        profileFilled: true,
        profileFilledAt: new Date(),
      };
      const mockProfile = { id: 1, userId: 1, ...data, user: { id: 1 } };
      mockPrisma.userProfile.create.mockResolvedValue(mockProfile);

      const result = await repository.fillProfile(1, data as any);

      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const data = { firstName: 'Jane', profileUpdatedAt: new Date() };
      const mockProfile = { id: 1, userId: 1, ...data, user: { id: 1 } };
      mockPrisma.userProfile.update.mockResolvedValue(mockProfile);

      const result = await repository.updateProfile(1, data as any);

      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateAvatarUrl', () => {
    it('should update avatar URL', async () => {
      mockPrisma.userProfile.update.mockResolvedValue({});

      await repository.updateAvatarUrl(1, 'https://example.com/avatar.jpg');

      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: {
          avatarUrl: 'https://example.com/avatar.jpg',
          profileUpdatedAt: expect.any(Date),
        },
      });
    });

    it('should remove avatar URL when null', async () => {
      mockPrisma.userProfile.update.mockResolvedValue({});

      await repository.updateAvatarUrl(1, null);

      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { avatarUrl: null, profileUpdatedAt: expect.any(Date) },
      });
    });
  });

  describe('findUserProfileByUserId', () => {
    it('should find user profile by userId', async () => {
      const mockProfile = { id: 1, userId: 1, user: { id: 1 } };
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await repository.findUserProfileByUserId(1);

      expect(result).toEqual(mockProfile);
    });

    it('should return null when profile not found', async () => {
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      const result = await repository.findUserProfileByUserId(999);

      expect(result).toBeNull();
    });
  });
});
