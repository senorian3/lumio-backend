import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { CreateUserDomainDto } from '@lumio/modules/user-accounts/users/domain/dto/create-user.domain.dto';
import { add } from 'date-fns';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockPrismaService: PrismaService;

  const mockUserEntity = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    emailConfirmation: {
      id: 1,
      userId: 1,
      isConfirmed: false,
      confirmationCode: 'code-123',
      expirationDate: add(new Date(), { hours: 1 }),
    },
  };

  const mockEmailConfirmation = {
    id: 1,
    userId: 1,
    isConfirmed: false,
    confirmationCode: 'code-123',
    expirationDate: new Date(),
    user: mockUserEntity,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
            emailConfirmation: {
              findFirst: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    mockPrismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('doesExistByUsernameOrEmail', () => {
    it('should return user when found by username', async () => {
      // Arrange
      const username = 'testuser';
      const email = 'test@example.com';
      (mockPrismaService.user.findFirst as jest.Mock).mockResolvedValue(
        mockUserEntity,
      );

      // Act
      const result = await repository.doesExistByUsernameOrEmail(
        username,
        email,
      );

      // Assert
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username, deletedAt: null },
            { email, deletedAt: null },
          ],
        },
      });
      expect(result).toEqual(mockUserEntity);
    });

    it('should return null when user not found', async () => {
      // Arrange
      (mockPrismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await repository.doesExistByUsernameOrEmail(
        'username',
        'email',
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user with email confirmation', async () => {
      // Arrange
      const dto = new CreateUserDomainDto(
        'newuser',
        'password123',
        'new@example.com',
      );
      const passwordHash = 'hashedPassword123';
      const mockCreatedUser = {
        ...mockUserEntity,
        username: dto.username,
        email: dto.email,
      };
      (mockPrismaService.user.create as jest.Mock).mockResolvedValue(
        mockCreatedUser,
      );

      // Act
      const result = await repository.createUser(dto, passwordHash);

      // Assert
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: dto.username,
          email: dto.email,
          password: passwordHash,
          emailConfirmation: {
            create: {
              isConfirmed: false,
              confirmationCode: expect.any(String),
              expirationDate: expect.any(Date),
            },
          },
        },
        include: {
          emailConfirmation: true,
        },
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should create user with confirmed email when isConfirmed is true', async () => {
      // Arrange
      const dto = new CreateUserDomainDto(
        'confirmeduser',
        'password123',
        'confirmed@example.com',
      );
      const passwordHash = 'hashedPassword123';
      const isConfirmed = true;
      (mockPrismaService.user.create as jest.Mock).mockResolvedValue(
        mockUserEntity,
      );

      // Act
      await repository.createUser(dto, passwordHash, isConfirmed);

      // Assert
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: dto.username,
          email: dto.email,
          password: passwordHash,
          emailConfirmation: {
            create: {
              isConfirmed: true,
              confirmationCode: expect.any(String),
              expirationDate: expect.any(Date),
            },
          },
        },
        include: {
          emailConfirmation: true,
        },
      });
    });
  });

  describe('findByCodeOrIdEmailConfirmation', () => {
    it('should find by confirmation code', async () => {
      // Arrange
      const code = 'confirmation-code';
      (
        mockPrismaService.emailConfirmation.findFirst as jest.Mock
      ).mockResolvedValue(mockEmailConfirmation);

      // Act
      const result = await repository.findByCodeOrIdEmailConfirmation({ code });

      // Assert
      expect(
        mockPrismaService.emailConfirmation.findFirst,
      ).toHaveBeenCalledWith({
        where: { confirmationCode: code },
        include: { user: true },
      });
      expect(result).toEqual(mockEmailConfirmation);
    });

    it('should find by userId', async () => {
      // Arrange
      const userId = 1;
      (
        mockPrismaService.emailConfirmation.findFirst as jest.Mock
      ).mockResolvedValue(mockEmailConfirmation);

      // Act
      const result = await repository.findByCodeOrIdEmailConfirmation({
        userId,
      });

      // Assert
      expect(
        mockPrismaService.emailConfirmation.findFirst,
      ).toHaveBeenCalledWith({
        where: { userId },
        include: { user: true },
      });
      expect(result).toEqual(mockEmailConfirmation);
    });

    it('should return null when neither code nor userId provided', async () => {
      // Act
      const result = await repository.findByCodeOrIdEmailConfirmation({});

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const email = 'test@example.com';
      (mockPrismaService.user.findFirst as jest.Mock).mockResolvedValue(
        mockUserEntity,
      );

      // Act
      const result = await repository.findUserByEmail(email);

      // Assert
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email },
        include: { emailConfirmation: true },
      });
      expect(result).toEqual(mockUserEntity);
    });
  });

  describe('updateCodeAndExpirationDate', () => {
    it('should update confirmation code and expiration date', async () => {
      // Arrange
      const userId = 1;
      const newCode = 'new-code';
      const newDate = new Date();
      (
        mockPrismaService.emailConfirmation.update as jest.Mock
      ).mockResolvedValue({});

      // Act
      await repository.updateCodeAndExpirationDate(userId, newCode, newDate);

      // Assert
      expect(mockPrismaService.emailConfirmation.update).toHaveBeenCalledWith({
        where: { userId },
        data: {
          confirmationCode: newCode,
          expirationDate: newDate,
          isConfirmed: false,
        },
      });
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      // Arrange
      const userId = 1;
      const newPasswordHash = 'newHashedPassword';
      (mockPrismaService.user.update as jest.Mock).mockResolvedValue({});

      // Act
      await repository.updatePassword(userId, newPasswordHash);

      // Assert
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: newPasswordHash },
      });
    });
  });

  describe('confirmEmail', () => {
    it('should confirm user email', async () => {
      // Arrange
      const userId = 1;
      (
        mockPrismaService.emailConfirmation.update as jest.Mock
      ).mockResolvedValue({});

      // Act
      await repository.confirmEmail(userId);

      // Assert
      expect(mockPrismaService.emailConfirmation.update).toHaveBeenCalledWith({
        where: { userId },
        data: { isConfirmed: true },
      });
    });
  });

  describe('deleteExpiredUserRegistration', () => {
    it('should delete expired unconfirmed users', async () => {
      // Arrange
      const date = new Date();
      const mockUsers = [{ id: 1 }, { id: 2 }];
      const mockTransaction = jest.fn();
      (mockPrismaService.$transaction as jest.Mock).mockImplementation(
        mockTransaction,
      );
      mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          user: {
            findMany: jest.fn().mockResolvedValue(mockUsers),
            deleteMany: jest.fn().mockResolvedValue({}),
          },
          emailConfirmation: {
            deleteMany: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      // Act
      await repository.deleteExpiredUserRegistration(date);

      // Assert
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('findUserById', () => {
    it('should find user by id with relations', async () => {
      // Arrange
      const userId = 1;
      const userWithRelations = {
        ...mockUserEntity,
        emailConfirmation: mockEmailConfirmation,
        sessions: [],
      };
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(
        userWithRelations,
      );

      // Act
      const result = await repository.findUserById(userId);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: {
          emailConfirmation: true,
          sessions: true,
        },
      });
      expect(result).toEqual(userWithRelations);
    });
  });
});
