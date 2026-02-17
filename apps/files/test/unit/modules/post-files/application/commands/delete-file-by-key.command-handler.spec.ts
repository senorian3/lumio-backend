import { Test, TestingModule } from '@nestjs/testing';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  DeleteFileByKeyCommandHandler,
  DeleteFileByKeyCommand,
} from '@files/modules/post-files/application/commands/delete-file-by-key.command-handler';

describe('DeleteFileByKeyCommandHandler', () => {
  let handler: DeleteFileByKeyCommandHandler;
  let mockS3Adapter: jest.Mocked<S3FilesHttpAdapter>;

  const mockKey = 'posts/123/file1.jpg';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteFileByKeyCommandHandler,
        {
          provide: S3FilesHttpAdapter,
          useValue: {
            deleteFile: jest.fn(),
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

    handler = module.get<DeleteFileByKeyCommandHandler>(
      DeleteFileByKeyCommandHandler,
    );
    mockS3Adapter = module.get(S3FilesHttpAdapter);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should delete file successfully', async () => {
      // Arrange
      const command = new DeleteFileByKeyCommand(mockKey);

      mockS3Adapter.deleteFile.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockS3Adapter.deleteFile).toHaveBeenCalledWith(mockKey);
    });

    it('should throw error when delete fails', async () => {
      // Arrange
      const command = new DeleteFileByKeyCommand(mockKey);
      const deleteError = new Error('S3 delete failed');

      mockS3Adapter.deleteFile.mockRejectedValue(deleteError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(deleteError);
    });
  });
});
