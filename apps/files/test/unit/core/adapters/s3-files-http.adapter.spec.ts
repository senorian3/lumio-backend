import { Test, TestingModule } from '@nestjs/testing';
import { S3FilesHttpAdapter } from '@files/core/adapters/s3-files-http.adapter';
import { CoreConfig } from '@files/core/core.config';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('S3FilesHttpAdapter', () => {
  let adapter: S3FilesHttpAdapter;

  const mockConfig = {
    s3BucketName: 'test-bucket',
    s3Region: 'ru-central1',
    s3Endpoint: 'https://storage.yandexcloud.net',
    s3AccessKeyId: 'test-key',
    s3SecretAccessKey: 'test-secret',
  };

  // Mock S3Client
  const mockSend = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3FilesHttpAdapter,
        {
          provide: CoreConfig,
          useValue: mockConfig,
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    adapter = module.get<S3FilesHttpAdapter>(S3FilesHttpAdapter);

    // Access private s3 client for mocking
    (adapter as any).s3 = {
      send: mockSend,
    };
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('uploadFiles', () => {
    it('should upload files successfully', async () => {
      // Arrange
      mockSend.mockResolvedValue({});

      const files = [{ buffer: Buffer.from('test'), originalname: 'test.jpg' }];

      // Act
      const result = await adapter.uploadFiles('posts', '123', files);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].key).toContain('content/posts/123/');
      expect(result[0].url).toContain('test-bucket.storage.yandexcloud.net');
      expect(result[0].mimetype).toBe('image/jpeg');
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle multiple files', async () => {
      // Arrange
      mockSend.mockResolvedValue({});

      const files = [
        { buffer: Buffer.from('test1'), originalname: 'test1.jpg' },
        { buffer: Buffer.from('test2'), originalname: 'test2.png' },
      ];

      // Act
      const result = await adapter.uploadFiles('posts', '123', files);

      // Assert
      expect(result).toHaveLength(2);
    });

    it('should use default png mimetype for unknown extensions', async () => {
      // Arrange
      mockSend.mockResolvedValue({});

      const files = [
        { buffer: Buffer.from('test'), originalname: 'test.unknown' },
      ];

      // Act
      const result = await adapter.uploadFiles('posts', '123', files);

      // Assert
      expect(result[0].mimetype).toBe('image/png');
    });

    it('should handle upload errors', async () => {
      // Arrange
      mockSend.mockRejectedValue(new Error('Upload failed'));

      const files = [{ buffer: Buffer.from('test'), originalname: 'test.jpg' }];

      // Act & Assert
      await expect(adapter.uploadFiles('posts', '123', files)).rejects.toThrow(
        'Upload failed',
      );
    });

    it('should handle users type correctly', async () => {
      // Arrange
      mockSend.mockResolvedValue({});

      const files = [
        { buffer: Buffer.from('test'), originalname: 'avatar.jpg' },
      ];

      // Act
      const result = await adapter.uploadFiles('users', '1', files);

      // Assert
      expect(result[0].key).toContain('content/users/1/');
    });

    it('should handle numeric id', async () => {
      // Arrange
      mockSend.mockResolvedValue({});

      const files = [{ buffer: Buffer.from('test'), originalname: 'test.jpg' }];

      // Act
      const result = await adapter.uploadFiles('posts', 123, files);

      // Assert
      expect(result[0].key).toContain('content/posts/123/');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      // Arrange
      mockSend.mockResolvedValue({});

      const s3Key = 'content/posts/123/test.jpg';

      // Act
      await adapter.deleteFile(s3Key);

      // Assert
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      // Arrange
      mockSend.mockRejectedValue(new Error('Delete failed'));

      const s3Key = 'content/posts/123/test.jpg';

      // Act & Assert
      await expect(adapter.deleteFile(s3Key)).rejects.toThrow('Delete failed');
    });
  });
});
