import { Test, TestingModule } from '@nestjs/testing';
import {
  FillProfileCommandHandler,
  FillProfileCommand,
} from '@lumio/modules/user-accounts/profile/application/commands/fill-profile.command-handler';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { FillProfileTransferDto } from '@lumio/modules/user-accounts/profile/api/dto/transfer/fill-profile.transfer.dto';
import { ProfileView } from '@lumio/modules/user-accounts/profile/api/dto/output/profile.output.dto';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';

describe('FillProfileCommandHandler', () => {
  let handler: FillProfileCommandHandler;
  let mockUserRepository: UserRepository;

  const mockFillProfileDto = new FillProfileTransferDto();
  mockFillProfileDto.firstName = 'John';
  mockFillProfileDto.lastName = 'Doe';
  mockFillProfileDto.dateOfBirth = new Date('1990-01-01');
  mockFillProfileDto.country = 'USA';
  mockFillProfileDto.city = 'New York';
  mockFillProfileDto.aboutMe = 'About me';

  const mockUserProfile = {
    id: 1,
    firstName: null,
    lastName: null,
    dateOfBirth: null,
    country: null,
    city: null,
    aboutMe: null,
    avatarUrl: null,
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

  const mockFilledUserProfile = {
    ...mockUserProfile,
    ...mockFillProfileDto,
    profileFilled: true,
    profileFilledAt: expect.any(Date),
  };

  const mockFilledUser = {
    ...mockUser,
    profile: mockFilledUserProfile,
  };

  const mockProfileView = ProfileView.fromEntity(
    mockFilledUser,
    mockFilledUser.profile,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FillProfileCommandHandler,
        {
          provide: UserRepository,
          useValue: {
            findUserById: jest.fn(),
            findUserProfileByUserId: jest.fn(),
            fillProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<FillProfileCommandHandler>(FillProfileCommandHandler);
    mockUserRepository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should fill user profile successfully', async () => {
      // Arrange
      const userId = 1;
      const requestUserId = 1;
      const command = new FillProfileCommand(
        mockFillProfileDto,
        userId,
        requestUserId,
      );

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (
        mockUserRepository.findUserProfileByUserId as jest.Mock
      ).mockResolvedValue(null);
      (mockUserRepository.fillProfile as jest.Mock).mockResolvedValue(
        mockFilledUserProfile,
      );
      jest.spyOn(ProfileView, 'fromEntity').mockReturnValue(mockProfileView);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findUserProfileByUserId).toHaveBeenCalledWith(
        userId,
      );
      expect(mockUserRepository.fillProfile).toHaveBeenCalledWith(userId, {
        ...mockFillProfileDto,
        profileFilledAt: expect.any(Date),
        profileFilled: true,
      });
      expect(ProfileView.fromEntity).toHaveBeenCalledWith(
        mockUser,
        mockFilledUserProfile,
      );
      expect(result).toEqual(mockProfileView);
    });

    it('should throw BadRequestDomainException when user not found', async () => {
      // Arrange
      const userId = 999;
      const requestUserId = 999;
      const command = new FillProfileCommand(
        mockFillProfileDto,
        userId,
        requestUserId,
      );

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.fillProfile).not.toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when profile already filled', async () => {
      // Arrange
      const userId = 1;
      const requestUserId = 1;
      const alreadyFilledUser = {
        ...mockUser,
        profile: { ...mockUser.profile, profileFilled: true },
      };
      const command = new FillProfileCommand(
        mockFillProfileDto,
        userId,
        requestUserId,
      );

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        alreadyFilledUser,
      );
      (
        mockUserRepository.findUserProfileByUserId as jest.Mock
      ).mockResolvedValue(alreadyFilledUser.profile);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findUserProfileByUserId).toHaveBeenCalledWith(
        userId,
      );
      expect(mockUserRepository.fillProfile).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenDomainException when user tries to fill profile for another user', async () => {
      // Arrange
      const userId = 1;
      const requestUserId = 2; // Different user
      const command = new FillProfileCommand(
        mockFillProfileDto,
        userId,
        requestUserId,
      );

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (
        mockUserRepository.findUserProfileByUserId as jest.Mock
      ).mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenDomainException,
      );
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findUserProfileByUserId).toHaveBeenCalledWith(
        userId,
      );
      expect(mockUserRepository.fillProfile).not.toHaveBeenCalled();
    });

    it('should handle repository findUserById error', async () => {
      // Arrange
      const userId = 1;
      const requestUserId = 1;
      const command = new FillProfileCommand(
        mockFillProfileDto,
        userId,
        requestUserId,
      );
      const dbError = new Error('Database connection failed');

      (mockUserRepository.findUserById as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.fillProfile).not.toHaveBeenCalled();
    });

    it('should handle repository fillProfile error', async () => {
      // Arrange
      const userId = 1;
      const requestUserId = 1;
      const command = new FillProfileCommand(
        mockFillProfileDto,
        userId,
        requestUserId,
      );
      const fillError = new Error('Fill profile failed');

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (
        mockUserRepository.findUserProfileByUserId as jest.Mock
      ).mockResolvedValue(null);
      (mockUserRepository.fillProfile as jest.Mock).mockRejectedValue(
        fillError,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(fillError);
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findUserProfileByUserId).toHaveBeenCalledWith(
        userId,
      );
      expect(mockUserRepository.fillProfile).toHaveBeenCalledWith(userId, {
        ...mockFillProfileDto,
        profileFilledAt: expect.any(Date),
        profileFilled: true,
      });
    });
  });
});
