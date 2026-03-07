import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from '@lumio/modules/user-accounts/profile/api/profile.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { InputEditProfileDto } from '@lumio/modules/user-accounts/profile/api/dto/input/edit-profile.input.dto';
import { InputFillProfileDto } from '@lumio/modules/user-accounts/profile/api/dto/input/fill-profile.input.dto';
import { ProfileView } from '@lumio/modules/user-accounts/profile/api/dto/output/profile.output.dto';
import { SingleFileValidationPipe } from '@libs/core/pipe/validation/validation-file.pipe';

describe('ProfileController', () => {
  let profileController: ProfileController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockProfileView: ProfileView = {
    id: 1,
    username: 'testuser',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '01.01.1990',
    country: 'USA',
    city: 'New York',
    aboutMe: 'Test user',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  const mockFile = {
    originalname: 'avatar.jpg',
    mimetype: 'image/jpeg',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('test'),
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overridePipe(SingleFileValidationPipe)
      .useValue({ transform: jest.fn(() => mockFile) })
      .compile();

    profileController = module.get<ProfileController>(ProfileController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  describe('getProfile', () => {
    it('should return user profile by userId', async () => {
      const userId = 1;
      queryBus.execute.mockResolvedValue(mockProfileView);

      const result = await profileController.getProfile(userId);

      expect(result).toEqual(mockProfileView);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
      );
    });
  });

  describe('uploadUserAvatar', () => {
    it('should upload user avatar and return URL', async () => {
      const userId = 1;
      const expectedResult = { url: 'https://example.com/avatar.jpg' };

      commandBus.execute.mockResolvedValue(expectedResult);

      const result = await profileController.uploadUserAvatar(userId, mockFile);

      expect(result).toEqual(expectedResult);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId, avatar: mockFile }),
      );
    });
  });

  describe('fillProfile', () => {
    it('should fill user profile', async () => {
      const userId = 1;
      const currentUserId = 1;
      const fillProfileDto: InputFillProfileDto = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        country: 'USA',
        city: 'New York',
        aboutMe: 'Test user',
      };

      commandBus.execute.mockResolvedValue(mockProfileView);

      const result = await profileController.fillProfile(
        userId,
        fillProfileDto,
        currentUserId,
      );

      expect(result).toEqual(mockProfileView);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          profileInformation: fillProfileDto,
          userId,
          requestUserId: currentUserId,
        }),
      );
    });

    it('should throw error when userId does not match currentUserId', async () => {
      const userId = 1;
      const currentUserId = 2; // Different user
      const fillProfileDto: InputFillProfileDto = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        country: 'USA',
        city: 'New York',
        aboutMe: 'Test user',
      };

      // Mock the command handler to throw an error
      commandBus.execute.mockRejectedValue(
        new Error('User can only fill their own profile'),
      );

      await expect(
        profileController.fillProfile(userId, fillProfileDto, currentUserId),
      ).rejects.toThrow('User can only fill their own profile');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = 1;
      const currentUserId = 1;
      const editProfileDto: InputEditProfileDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1995-05-15'),
        country: 'Canada',
        city: 'Toronto',
        aboutMe: 'Updated profile',
      };

      commandBus.execute.mockResolvedValue(mockProfileView);

      const result = await profileController.updateProfile(
        userId,
        editProfileDto,
        currentUserId,
      );

      expect(result).toEqual(mockProfileView);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          profileInformation: editProfileDto,
          userId,
          requestUserId: currentUserId,
        }),
      );
    });

    it('should throw error when userId does not match currentUserId', async () => {
      const userId = 1;
      const currentUserId = 2; // Different user
      const editProfileDto: InputEditProfileDto = {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1995-05-15'),
        country: 'Canada',
        city: 'Toronto',
        aboutMe: 'Updated profile',
      };

      commandBus.execute.mockRejectedValue(
        new Error('User can only update their own profile'),
      );

      await expect(
        profileController.updateProfile(userId, editProfileDto, currentUserId),
      ).rejects.toThrow('User can only update their own profile');
    });
  });

  describe('deleteUserAvatar', () => {
    it('should delete user avatar', async () => {
      const userId = 1;

      commandBus.execute.mockResolvedValue(undefined);

      await profileController.deleteUserAvatar(userId);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
      );
    });
  });
});
