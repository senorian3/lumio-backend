import { Test, TestingModule } from '@nestjs/testing';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { FileRepository } from '@files/modules/post-files/domain/infrastructure/file.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  DeletedPostFilesCommandHandler,
  DeletedPostFilesCommand,
} from '@files/modules/post-files/application/commands/deleted-post-files.command-handler';

describe('DeletedPostFilesCommandHandler', () => {
  let handler: DeletedPostFilesCommandHandler;
  let mockS3Adapter: jest.Mocked<S3FilesHttpAdapter>;
  let mockFileRepository: jest.Mocked<FileRepository>;
  let mockLogger: jest.Mocked<AppLoggerService>;

  const mockPostId = '123';

  const mockPostFiles = [
    { key: 'posts/123/file1.jpg', id: 1 },
    { key: 'posts/123/file2.png', id: 2 },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletedPostFilesCommandHandler,
        {
          provide: S3FilesHttpAdapter,
          useValue: {
            deleteFile: jest.fn(),
          },
        },
        {
          provide: FileRepository,
          useValue: {
            findFilesByPostId: jest.fn(),
            softDeleteFilesByPostId: jest.fn(),
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

    handler = module.get<DeletedPostFilesCommandHandler>(
      DeletedPostFilesCommandHandler,
    );
    mockS3Adapter = module.get(S3FilesHttpAdapter);
    mockFileRepository = module.get(FileRepository);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should soft delete files successfully', async () => {
      // Arrange
      const command = new DeletedPostFilesCommand(mockPostId);

      mockFileRepository.findFilesByPostId.mockResolvedValue(
        mockPostFiles as any,
      );
      mockFileRepository.softDeleteFilesByPostId.mockResolvedValue(undefined);
      mockS3Adapter.deleteFile.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFileRepository.findFilesByPostId).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockFileRepository.softDeleteFilesByPostId).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockS3Adapter.deleteFile).toHaveBeenCalledTimes(2);
    });

    it('should return early when no files found', async () => {
      // Arrange
      const command = new DeletedPostFilesCommand(mockPostId);

      mockFileRepository.findFilesByPostId.mockResolvedValue([]);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockFileRepository.findFilesByPostId).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockFileRepository.softDeleteFilesByPostId).not.toHaveBeenCalled();
      expect(mockS3Adapter.deleteFile).not.toHaveBeenCalled();
    });

    it('should throw error when soft delete fails', async () => {
      // Arrange
      const command = new DeletedPostFilesCommand(mockPostId);
      const dbError = new Error('Database error');

      mockFileRepository.findFilesByPostId.mockResolvedValue(
        mockPostFiles as any,
      );
      mockFileRepository.softDeleteFilesByPostId.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
    });

    it('should continue deleting S3 files even if one fails', async () => {
      // Arrange
      const command = new DeletedPostFilesCommand(mockPostId);

      mockFileRepository.findFilesByPostId.mockResolvedValue(
        mockPostFiles as any,
      );
      mockFileRepository.softDeleteFilesByPostId.mockResolvedValue(undefined);
      mockS3Adapter.deleteFile
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('S3 error'));

      // Act
      await handler.execute(command);

      // Assert
      expect(mockS3Adapter.deleteFile).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
