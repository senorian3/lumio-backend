import { Test, TestingModule } from '@nestjs/testing';
import {
  UpdateProfileCommandHandler,
  UpdateProfileCommand,
} from '@lumio/modules/user-accounts/profile/application/commands/update-profile.command-handler';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { EditProfileTransferDto } from '@lumio/modules/user-accounts/profile/api/dto/transfer/edit-profile.transfer.dto';
import { ProfileView } from '@lumio/modules/user-accounts/profile/api/dto/output/profile.output.dto';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
} from '@libs/core/exceptions/domain-exceptions';

describe('UpdateProfileCommandHandler', () => {
  let handler: UpdateProfileCommandHandler;
  let mockUserRepository: UserRepository;

  const mockEditProfileDto = new EditProfileTransferDto();
  mockEditProfileDto.firstName = 'John';
  mockEditProfileDto.lastName = 'Doe';
  mockEditProfileDto.dateOfBirth = new Date('1990-01-01');
  mockEditProfileDto.country = 'USA';
  mockEditProfileDto.city = 'New York';
  mockEditProfileDto.aboutMe = 'About me';

  const mockUserProfile = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    country: 'USA',
    city: 'New York',
    aboutMe: 'About me',
    avatarUrl: 'avatar.jpg',
    profileFilled: true,
    profileFilledAt: new Date(),
    profileUpdatedAt: null,
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

  const mockUpdatedUserProfile = {
    ...mockUserProfile,
    firstName: 'Jane',
    lastName: 'Smith',
  };

  const mockUpdatedUser = {
    ...mockUser,
    profile: mockUpdatedUserProfile,
  };

  const mockProfileView = ProfileView.fromEntity(
    mockUpdatedUser,
    mockUpdatedUser.profile,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProfileCommandHandler,
        {
          provide: UserRepository,
          useValue: {
            findUserById: jest.fn(),
            findUserProfileByUserId: jest.fn(),
            updateProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<UpdateProfileCommandHandler>(
      UpdateProfileCommandHandler,
    );
    mockUserRepository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const userId = 1;
      const requestUserId = 1;
      const command = new UpdateProfileCommand(
        mockEditProfileDto,
        userId,
        requestUserId,
      );

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (
        mockUserRepository.findUserProfileByUserId as jest.Mock
      ).mockResolvedValue(mockUserProfile);
      (mockUserRepository.updateProfile as jest.Mock).mockResolvedValue(
        mockUpdatedUserProfile,
      );
      jest.spyOn(ProfileView, 'fromEntity').mockReturnValue(mockProfileView);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith(userId, {
        ...mockEditProfileDto,
        profileUpdatedAt: expect.any(Date),
      });
      expect(ProfileView.fromEntity).toHaveBeenCalledWith(
        mockUser,
        mockUpdatedUserProfile,
      );
      expect(result).toEqual(mockProfileView);
    });

    it('should throw BadRequestDomainException when user not found', async () => {
      // Arrange
      const userId = 999;
      const requestUserId = 999;
      const command = new UpdateProfileCommand(
        mockEditProfileDto,
        userId,
        requestUserId,
      );

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.updateProfile).not.toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when profile not filled', async () => {
      // Arrange
      const userId = 1;
      const requestUserId = 1;
      const notFilledUser = {
        ...mockUser,
        profile: { ...mockUser.profile, profileFilled: false },
      };
      const command = new UpdateProfileCommand(
        mockEditProfileDto,
        userId,
        requestUserId,
      );

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        notFilledUser,
      );
      (
        mockUserRepository.findUserProfileByUserId as jest.Mock
      ).mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findUserProfileByUserId).toHaveBeenCalledWith(
        userId,
      );
      expect(mockUserRepository.updateProfile).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenDomainException when user tries to update another user profile', async () => {
      // Arrange
      const userId = 1;
      const requestUserId = 2; // Different user
      const command = new UpdateProfileCommand(
        mockEditProfileDto,
        userId,
        requestUserId,
      );

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (
        mockUserRepository.findUserProfileByUserId as jest.Mock
      ).mockResolvedValue(mockUserProfile);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenDomainException,
      );
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findUserProfileByUserId).toHaveBeenCalledWith(
        userId,
      );
      expect(mockUserRepository.updateProfile).not.toHaveBeenCalled();
    });

    it('should handle repository findUserById error', async () => {
      // Arrange
      const userId = 1;
      const requestUserId = 1;
      const command = new UpdateProfileCommand(
        mockEditProfileDto,
        userId,
        requestUserId,
      );
      const dbError = new Error('Database connection failed');

      (mockUserRepository.findUserById as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.updateProfile).not.toHaveBeenCalled();
    });

    it('should handle repository updateProfile error', async () => {
      // Arrange
      const userId = 1;
      const requestUserId = 1;
      const command = new UpdateProfileCommand(
        mockEditProfileDto,
        userId,
        requestUserId,
      );
      const updateError = new Error('Update failed');

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (
        mockUserRepository.findUserProfileByUserId as jest.Mock
      ).mockResolvedValue(mockUserProfile);
      (mockUserRepository.updateProfile as jest.Mock).mockRejectedValue(
        updateError,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(updateError);
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findUserProfileByUserId).toHaveBeenCalledWith(
        userId,
      );
      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith(userId, {
        ...mockEditProfileDto,
        profileUpdatedAt: expect.any(Date),
      });
    });

    it('should handle partial profile update', async () => {
      // Arrange
      const partialDto = new EditProfileTransferDto();
      partialDto.firstName = 'NewName';
      // Other fields remain undefined

      const userId = 1;
      const requestUserId = 1;
      const command = new UpdateProfileCommand(
        partialDto,
        userId,
        requestUserId,
      );

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (
        mockUserRepository.findUserProfileByUserId as jest.Mock
      ).mockResolvedValue(mockUserProfile);
      (mockUserRepository.updateProfile as jest.Mock).mockResolvedValue(
        mockUpdatedUser,
      );
      jest.spyOn(ProfileView, 'fromEntity').mockReturnValue(mockProfileView);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith(userId, {
        ...partialDto,
        profileUpdatedAt: expect.any(Date),
      });
      expect(result).toEqual(mockProfileView);
    });

    it('should handle empty profile data', async () => {
      // Arrange
      const emptyDto = new EditProfileTransferDto();
      // All fields remain undefined

      const userId = 1;
      const requestUserId = 1;
      const command = new UpdateProfileCommand(emptyDto, userId, requestUserId);

      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (
        mockUserRepository.findUserProfileByUserId as jest.Mock
      ).mockResolvedValue(mockUserProfile);
      (mockUserRepository.updateProfile as jest.Mock).mockResolvedValue(
        mockUpdatedUser,
      );
      jest.spyOn(ProfileView, 'fromEntity').mockReturnValue(mockProfileView);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith(userId, {
        ...emptyDto,
        profileUpdatedAt: expect.any(Date),
      });
      expect(result).toEqual(mockProfileView);
    });
  });
});
