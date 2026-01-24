import { Test, TestingModule } from '@nestjs/testing';
import {
  GetProfileQueryHandler,
  GetProfileQuery,
} from '@lumio/modules/user-accounts/profile/application/queries/get-profile.query-handler';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { ProfileView } from '@lumio/modules/user-accounts/profile/api/dto/output/profile.output.dto';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';

describe('GetProfileQueryHandler', () => {
  let handler: GetProfileQueryHandler;
  let mockUserRepository: UserRepository;

  const mockUserProfile = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    country: 'USA',
    city: 'New York',
    aboutMe: 'About me',
    avatarUrl: 'avatar.jpg',
    profileFilled: false,
    profileFilledAt: null,
    profileUpdatedAt: null,
    accountType: 'regular',
    userId: 1,
    user: {} as any,
  };

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    createdAt: new Date(),
    deletedAt: null,
    profile: mockUserProfile,
  };

  const mockProfileView = ProfileView.fromEntity(mockUser, mockUser.profile);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfileQueryHandler,
        {
          provide: UserRepository,
          useValue: {
            findUserById: jest.fn(),
            findUserProfileByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetProfileQueryHandler>(GetProfileQueryHandler);
    mockUserRepository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return profile view when user exists', async () => {
      // Arrange
      const userId = 1;
      const query = new GetProfileQuery(userId);

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (
        mockUserRepository.findUserProfileByUserId as jest.Mock
      ).mockResolvedValue(mockUserProfile);
      jest.spyOn(ProfileView, 'fromEntity').mockReturnValue(mockProfileView);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findUserProfileByUserId).toHaveBeenCalledWith(
        userId,
      );
      expect(ProfileView.fromEntity).toHaveBeenCalledWith(
        mockUser,
        mockUserProfile,
      );
      expect(result).toEqual(mockProfileView);
    });

    it('should throw NotFoundDomainException when user not found', async () => {
      // Arrange
      const userId = 999;
      const query = new GetProfileQuery(userId);

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        NotFoundDomainException,
      );
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
    });

    it('should handle repository findUserById error', async () => {
      // Arrange
      const userId = 1;
      const query = new GetProfileQuery(userId);
      const dbError = new Error('Database connection failed');

      (mockUserRepository.findUserById as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
    });
  });
});
