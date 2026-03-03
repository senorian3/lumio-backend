import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { ProfileRepository } from '@files/modules/avatar/domain/infrastructure/profile.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  DeleteUserAvatarCommandHandler,
  DeleteUserAvatarCommand,
} from '@files/modules/avatar/application/commands/delete-user-avatar.command-handler';

describe('DeleteUserAvatarCommandHandler', () => {
  let handler: DeleteUserAvatarCommandHandler;
  let mockS3Adapter: jest.Mocked<S3FilesHttpAdapter>;
  let mockProfileRepository: jest.Mocked<ProfileRepository>;
  let mockLogger: jest.Mocked<AppLoggerService>;

  const mockUserId = 1;

  const mockAvatar = {
    id: 1,
    key: 'users/1/avatar.jpg',
    url: 'https://example.com/avatar.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    createdAt: new Date(),
    deletedAt: null,
    userId: mockUserId,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUserAvatarCommandHandler,
        {
          provide: S3FilesHttpAdapter,
          useValue: {
            deleteFile: jest.fn(),
          },
        },
        {
          provide: ProfileRepository,
          useValue: {
            getAvatarByUserId: jest.fn(),
            deleteAvatar: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<DeleteUserAvatarCommandHandler>(
      DeleteUserAvatarCommandHandler,
    );
    mockS3Adapter = module.get(S3FilesHttpAdapter);
    mockProfileRepository = module.get(ProfileRepository);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should delete avatar successfully', async () => {
      // Arrange
      const command = new DeleteUserAvatarCommand(mockUserId);

      mockProfileRepository.getAvatarByUserId.mockResolvedValue(mockAvatar);
      mockProfileRepository.deleteAvatar.mockResolvedValue(undefined);
      mockS3Adapter.deleteFile.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockProfileRepository.getAvatarByUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockProfileRepository.deleteAvatar).toHaveBeenCalledWith(
        mockAvatar.id,
      );
      expect(mockS3Adapter.deleteFile).toHaveBeenCalledWith(mockAvatar.key);
    });

    it('should throw NotFoundDomainException when avatar not found', async () => {
      // Arrange
      const command = new DeleteUserAvatarCommand(mockUserId);

      mockProfileRepository.getAvatarByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe('Avatar is not found');
        expect(error.extensions[0]?.field).toBe('avatar');
      }
    });

    it('should throw error when DB delete fails', async () => {
      // Arrange
      const command = new DeleteUserAvatarCommand(mockUserId);
      const dbError = new Error('Database error');

      mockProfileRepository.getAvatarByUserId.mockResolvedValue(mockAvatar);
      mockProfileRepository.deleteAvatar.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
    });

    it('should log error when S3 delete fails', async () => {
      // Arrange
      const command = new DeleteUserAvatarCommand(mockUserId);

      mockProfileRepository.getAvatarByUserId.mockResolvedValue(mockAvatar);
      mockProfileRepository.deleteAvatar.mockResolvedValue(undefined);
      mockS3Adapter.deleteFile.mockRejectedValue(new Error('S3 error'));

      // Act
      await handler.execute(command);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Critical error deleting avatar from S3 for userId=${mockUserId}, key=${mockAvatar.key}: S3 error`,
        expect.anything(),
        DeleteUserAvatarCommandHandler.name,
      );
    });
  });
});
