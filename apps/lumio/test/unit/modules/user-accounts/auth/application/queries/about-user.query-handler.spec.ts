import { Test, TestingModule } from '@nestjs/testing';
import { AboutUserQueryHandler } from '@lumio/modules/user-accounts/auth/application/queries/about-user.query-handler';
import { AboutUserUserQuery } from '@lumio/modules/user-accounts/auth/application/queries/about-user.query-handler';
import { QueryUserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.query.repository';
import { UnauthorizedDomainException } from '@libs/core/exceptions/domain-exceptions';
import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';

describe('AboutUserQueryHandler', () => {
  let handler: AboutUserQueryHandler;
  let mockUserQueryRepository: QueryUserRepository;

  const mockUserId = 1;
  const mockUserProfile = {
    id: mockUserId,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    country: 'USA',
    city: 'New York',
    aboutMe: 'Test user',
    avatarUrl: null,
    profileFilled: false,
    profileFilledAt: null,
    profileUpdatedAt: null,
    userId: mockUserId,
    user: {} as any,
  };

  const mockUser: UserEntity = {
    id: mockUserId,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    deletedAt: null,
    profile: mockUserProfile,
    emailConfirmation: {
      id: 1,
      confirmationCode: 'code123',
      expirationDate: new Date(Date.now() + 10000),
      isConfirmed: true,
      userId: mockUserId,
    },
    sessions: [],
  };

  const mockAboutUserOutput = {
    userId: mockUserId,
    username: 'testuser',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AboutUserQueryHandler,
        {
          provide: QueryUserRepository,
          useValue: {
            getById: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<AboutUserQueryHandler>(AboutUserQueryHandler);
    mockUserQueryRepository =
      module.get<QueryUserRepository>(QueryUserRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return user information when user exists', async () => {
      // Arrange
      const query = new AboutUserUserQuery(mockUserId);
      (mockUserQueryRepository.getById as jest.Mock).mockResolvedValue(
        mockUser,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockUserQueryRepository.getById).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockAboutUserOutput);
    });

    it('should throw UnauthorizedDomainException when user not found', async () => {
      // Arrange
      const query = new AboutUserUserQuery(mockUserId);
      (mockUserQueryRepository.getById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        UnauthorizedDomainException,
      );

      try {
        await handler.execute(query);
        fail('Should have thrown an exception');
      } catch (error) {
        const unauthorizedException = error as InstanceType<
          typeof UnauthorizedDomainException
        >;
        expect(unauthorizedException.message).toBe('Unauthorized');
        expect(unauthorizedException.extensions[0]?.message).toBe(
          'Unauthorized',
        );
        expect(unauthorizedException.extensions[0]?.field).toBe('accessToken');
      }

      expect(mockUserQueryRepository.getById).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle database error when finding user', async () => {
      // Arrange
      const query = new AboutUserUserQuery(mockUserId);
      const dbError = new Error('Database connection failed');
      (mockUserQueryRepository.getById as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);
      expect(mockUserQueryRepository.getById).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle user with null email confirmation', async () => {
      // Arrange
      const userWithNullEmailConfirmation = {
        ...mockUser,
        emailConfirmation: null,
      };
      const query = new AboutUserUserQuery(mockUserId);
      (mockUserQueryRepository.getById as jest.Mock).mockResolvedValue(
        userWithNullEmailConfirmation,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockUserQueryRepository.getById).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockAboutUserOutput);
    });

    it('should handle user with empty sessions array', async () => {
      // Arrange
      const userWithEmptySessions = {
        ...mockUser,
        sessions: [],
      };
      const query = new AboutUserUserQuery(mockUserId);
      (mockUserQueryRepository.getById as jest.Mock).mockResolvedValue(
        userWithEmptySessions,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockUserQueryRepository.getById).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockAboutUserOutput);
    });

    it('should handle user with different username and email', async () => {
      // Arrange
      const differentUser = {
        ...mockUser,
        username: 'different_username',
        email: 'different@example.com',
      };
      const expectedOutput = {
        userId: mockUserId,
        username: 'different_username',
        email: 'different@example.com',
      };
      const query = new AboutUserUserQuery(mockUserId);
      (mockUserQueryRepository.getById as jest.Mock).mockResolvedValue(
        differentUser,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockUserQueryRepository.getById).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(expectedOutput);
    });
  });
});
