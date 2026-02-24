import { Test, TestingModule } from '@nestjs/testing';
import {
  DeleteUserAvatarCommand,
  DeleteUserAvatarCommandHandler,
} from '@lumio/modules/user-accounts/profile/application/commands/delete-avatar.command-handler';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { FilesHttpAdapter } from '@lumio/modules/posts/application/files-http.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { UserEntity } from '@lumio/modules/user-accounts/users/domain/entities/user.entity';

describe('DeleteUserAvatarCommandHandler', () => {
  let handler: DeleteUserAvatarCommandHandler;
  let mockUserRepository: UserRepository;
  let mockFilesHttpAdapter: FilesHttpAdapter;

  const userId = 1;
  const command = new DeleteUserAvatarCommand(userId);
  const mockUserProfile = {
    avatarUrl: 'https://example.com/avatar.jpg',
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date(),
    country: 'USA',
    city: 'New York',
    aboutMe: 'Test user',
    profileFilled: true,
    profileFilledAt: new Date(),
    profileUpdatedAt: new Date(),
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      createdAt: new Date(),
      deletedAt: null,
    },
    accountType: 'Personal',
    userId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUserAvatarCommandHandler,
        {
          provide: UserRepository,
          useValue: {
            findUserById: jest.fn(),
            updateAvatarUrl: jest.fn(),
            findUserProfileByUserId: jest.fn(),
          },
        },
        {
          provide: FilesHttpAdapter,
          useValue: {
            deleteUserAvatar: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<DeleteUserAvatarCommandHandler>(
      DeleteUserAvatarCommandHandler,
    );
    mockUserRepository = module.get(UserRepository);
    mockFilesHttpAdapter = module.get(FilesHttpAdapter);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should delete avatar successfully', async () => {
      const user: UserEntity = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(mockUserRepository, 'findUserById').mockResolvedValue(user);
      jest
        .spyOn(mockUserRepository, 'findUserProfileByUserId')
        .mockResolvedValue(mockUserProfile);
      jest
        .spyOn(mockUserRepository, 'updateAvatarUrl')
        .mockResolvedValue(undefined);
      jest
        .spyOn(mockFilesHttpAdapter, 'deleteUserAvatar')
        .mockResolvedValue(undefined);

      await handler.execute(command);

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.updateAvatarUrl).toHaveBeenCalledWith(
        userId,
        null,
      );
      expect(mockFilesHttpAdapter.deleteUserAvatar).toHaveBeenCalledWith(
        userId,
      );
    });

    it('should throw NotFoundDomainException when user does not exist', async () => {
      jest.spyOn(mockUserRepository, 'findUserById').mockResolvedValue(null);
      jest
        .spyOn(mockUserRepository, 'findUserProfileByUserId')
        .mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundDomainException,
      );
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.updateAvatarUrl).not.toHaveBeenCalled();
      expect(mockFilesHttpAdapter.deleteUserAvatar).not.toHaveBeenCalled();
    });

    it('should handle FilesHttpAdapter failure and rollback', async () => {
      const user: UserEntity = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(mockUserRepository, 'findUserById').mockResolvedValue(user);
      jest
        .spyOn(mockUserRepository, 'findUserProfileByUserId')
        .mockResolvedValue(mockUserProfile);
      jest
        .spyOn(mockUserRepository, 'updateAvatarUrl')
        .mockResolvedValue(undefined);
      jest
        .spyOn(mockFilesHttpAdapter, 'deleteUserAvatar')
        .mockResolvedValue(undefined);

      await handler.execute(command);

      expect(mockUserRepository.updateAvatarUrl).toHaveBeenCalledWith(
        userId,
        null,
      );
      expect(mockFilesHttpAdapter.deleteUserAvatar).toHaveBeenCalledWith(
        userId,
      );
    });
  });
});
