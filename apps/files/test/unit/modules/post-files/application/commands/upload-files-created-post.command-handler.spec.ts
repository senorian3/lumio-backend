import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { FileRepository } from '@files/modules/post-files/domain/infrastructure/file.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  UploadFilesCreatedPostCommandHandler,
  UploadFilesCreatedPostCommand,
} from '@files/modules/post-files/application/commands/upload-post-file.command-handler';

describe('UploadFilesCreatedPostCommandHandler', () => {
  let handler: UploadFilesCreatedPostCommandHandler;
  let mockS3Adapter: jest.Mocked<S3FilesHttpAdapter>;
  let mockFileRepository: jest.Mocked<FileRepository>;
  let mockLogger: jest.Mocked<AppLoggerService>;

  const mockPostId = '123';

  const mockFiles = [
    { buffer: Buffer.from('test'), originalname: 'file1.jpg' },
    { buffer: Buffer.from('test'), originalname: 'file2.png' },
  ];

  const mockUploadedFiles = [
    {
      key: 'posts/123/file1.jpg',
      url: 'https://example.com/file1.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      id: 1,
      createdAt: new Date(),
      deletedAt: null,
      postId: '123',
    },
    {
      key: 'posts/123/file2.png',
      url: 'https://example.com/file2.png',
      mimetype: 'image/png',
      size: 2048,
      id: 2,
      createdAt: new Date(),
      deletedAt: null,
      postId: '123',
    },
  ] as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadFilesCreatedPostCommandHandler,
        {
          provide: S3FilesHttpAdapter,
          useValue: {
            uploadFiles: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
        {
          provide: FileRepository,
          useValue: {
            createFiles: jest.fn(),
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

    handler = module.get<UploadFilesCreatedPostCommandHandler>(
      UploadFilesCreatedPostCommandHandler,
    );
    mockS3Adapter = module.get(S3FilesHttpAdapter);
    mockFileRepository = module.get(FileRepository);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should upload files successfully', async () => {
      // Arrange
      const command = new UploadFilesCreatedPostCommand(mockPostId, mockFiles);

      mockS3Adapter.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockFileRepository.createFiles.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockS3Adapter.uploadFiles).toHaveBeenCalledWith(
        'posts',
        mockPostId,
        mockFiles,
      );
      expect(mockFileRepository.createFiles).toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when S3 upload fails', async () => {
      // Arrange
      const command = new UploadFilesCreatedPostCommand(mockPostId, mockFiles);
      const uploadError = new Error('S3 upload failed');

      mockS3Adapter.uploadFiles.mockRejectedValue(uploadError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException and cleanup S3 when DB fails', async () => {
      // Arrange
      const command = new UploadFilesCreatedPostCommand(mockPostId, mockFiles);
      const dbError = new Error('Database error');

      mockS3Adapter.uploadFiles.mockResolvedValue(mockUploadedFiles);
      mockFileRepository.createFiles.mockRejectedValue(dbError);
      mockS3Adapter.deleteFile.mockResolvedValue(undefined);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );

      expect(mockS3Adapter.deleteFile).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
