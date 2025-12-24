import { Test, TestingModule } from '@nestjs/testing';
import { UserQueryRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.query.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';

describe('UserQueryRepository', () => {
  let repository: UserQueryRepository;
  let mockPrismaService: jest.Mocked<PrismaService>;

  const mockUser: UserEntity = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    deletedAt: null,
    emailConfirmation: {
      id: 1,
      confirmationCode: 'code123',
      expirationDate: new Date(Date.now() + 10000),
      isConfirmed: true,
      userId: 1,
    },
    sessions: [],
    github: null,
    google: null,
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
            },
          },
        },
      ],
    }).compile();

    repository = module.get<UserQueryRepository>(UserQueryRepository);
    mockPrismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUser,
      );

      // Act
      const result = await repository.findById(1);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          emailConfirmation: true,
        },
      });
    });

    it('should return null when user not found', async () => {
      // Arrange
      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await repository.findById(999);

      // Assert
      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          emailConfirmation: true,
        },
      });
    });
  });
});
