import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { ProfileRepository } from '@files/modules/avatar/domain/infrastructure/profile.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  UploadUserAvatarCommandHandler,
  UploadUserAvatarCommand,
} from '@files/modules/avatar/application/commands/upload-user-avatar.command-handler';

describe('UploadUserAvatarCommandHandler', () => {
  let handler: UploadUserAvatarCommandHandler;
  let mockS3Adapter: jest.Mocked<S3FilesHttpAdapter>;
  let mockProfileRepository: jest.Mocked<ProfileRepository>;
  let mockLogger: jest.Mocked<AppLoggerService>;

  const mockUserId = 1;

  const mockAvatarFile = {
    buffer: Buffer.from('test'),
    originalname: 'avatar.jpg',
  } as Express.Multer.File;

  const mockUploadedFile = {
    key: 'users/1/avatar.jpg',
    url: 'https://example.com/avatar.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    id: 1,
    createdAt: new Date(),
    deletedAt: null,
    postId: '1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadUserAvatarCommandHandler,
        {
          provide: S3FilesHttpAdapter,
          useValue: {
            uploadFiles: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
        {
          provide: ProfileRepository,
          useValue: {
            createUserAvatar: jest.fn(),
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

    handler = module.get<UploadUserAvatarCommandHandler>(
      UploadUserAvatarCommandHandler,
    );
    mockS3Adapter = module.get(S3FilesHttpAdapter);
    mockProfileRepository = module.get(ProfileRepository);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should upload avatar successfully', async () => {
      // Arrange
      const command = new UploadUserAvatarCommand(mockUserId, mockAvatarFile);

      mockS3Adapter.uploadFiles.mockResolvedValue([mockUploadedFile]);
      mockProfileRepository.createUserAvatar.mockResolvedValue(undefined);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockS3Adapter.uploadFiles).toHaveBeenCalledWith(
        'users',
        mockUserId,
        [
          {
            buffer: mockAvatarFile.buffer,
            originalname: mockAvatarFile.originalname,
          },
        ],
      );
      expect(mockProfileRepository.createUserAvatar).toHaveBeenCalled();
      expect(result).toBe(mockUploadedFile.url);
    });

    it('should throw BadRequestDomainException when avatar file is missing', async () => {
      // Arrange
      const command = new UploadUserAvatarCommand(mockUserId, null as any);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
    });

    it('should throw error when S3 upload fails', async () => {
      // Arrange
      const command = new UploadUserAvatarCommand(mockUserId, mockAvatarFile);
      const uploadError = new Error('S3 upload failed');

      mockS3Adapter.uploadFiles.mockRejectedValue(uploadError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(uploadError);
    });

    it('should throw error when DB fails', async () => {
      // Arrange
      const command = new UploadUserAvatarCommand(mockUserId, mockAvatarFile);
      const dbError = new Error('Database error');

      mockS3Adapter.uploadFiles.mockResolvedValue([mockUploadedFile]);
      mockProfileRepository.createUserAvatar.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
