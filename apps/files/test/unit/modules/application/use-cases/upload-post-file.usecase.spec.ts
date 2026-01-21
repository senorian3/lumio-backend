import { FilesService } from '@files/core/services/s3.service';
import {
  UploadFilesCreatedPostCommandHandler,
  UploadFilesCreatedPostCommand,
} from '@files/modules/post-files/application/commands/upload-post-file.command-handler';
import { PostFileEntity } from '@files/modules/post-files/domain/entities/post-file.entity';
import { FileRepository } from '@files/modules/post-files/domain/infrastructure/file.repository';
import { Test, TestingModule } from '@nestjs/testing';

describe('UploadFilesCreatedPostCommandHandler', () => {
  let useCase: UploadFilesCreatedPostCommandHandler;
  let mockFilesService: FilesService;
  let mockFileRepository: FileRepository;

  const mockFiles = [
    {
      buffer: Buffer.from('test buffer 1'),
      originalname: 'test1.jpg',
    },
    {
      buffer: Buffer.from('test buffer 2'),
      originalname: 'test2.png',
    },
  ];

  const mockUploadedFiles: PostFileEntity[] = [
    {
      id: 1,
      key: 'content/posts/123/123_image_1_abc123.jpg',
      url: 'https://example.com/file1.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      createdAt: new Date(),
      deletedAt: null,
      postId: 123,
    },
    {
      id: 2,
      key: 'content/posts/123/123_image_2_def456.png',
      url: 'https://example.com/file2.png',
      mimetype: 'image/png',
      size: 2048,
      createdAt: new Date(),
      deletedAt: null,
      postId: 123,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadFilesCreatedPostCommandHandler,
        {
          provide: FilesService,
          useValue: {
            uploadFiles: jest.fn(),
          },
        },
        {
          provide: FileRepository,
          useValue: {
            createFile: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<UploadFilesCreatedPostCommandHandler>(
      UploadFilesCreatedPostCommandHandler,
    );
    mockFilesService = module.get<FilesService>(FilesService);
    mockFileRepository = module.get<FileRepository>(FileRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should upload files and save to repository', async () => {
      // Arrange
      const command = new UploadFilesCreatedPostCommand(123, mockFiles);
      (mockFilesService.uploadFiles as jest.Mock).mockResolvedValue(
        mockUploadedFiles,
      );
      (mockFileRepository.createFile as jest.Mock).mockResolvedValue(
        mockUploadedFiles[0],
      );

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockFilesService.uploadFiles).toHaveBeenCalledWith(
        'posts',
        123,
        mockFiles,
      );
      expect(mockFileRepository.createFile).toHaveBeenCalledTimes(2);
      expect(mockFileRepository.createFile).toHaveBeenCalledWith({
        key: mockUploadedFiles[0].key,
        url: mockUploadedFiles[0].url,
        mimetype: mockUploadedFiles[0].mimetype,
        size: mockUploadedFiles[0].size,
        postId: 123,
      });
      expect(mockFileRepository.createFile).toHaveBeenCalledWith({
        key: mockUploadedFiles[1].key,
        url: mockUploadedFiles[1].url,
        mimetype: mockUploadedFiles[1].mimetype,
        size: mockUploadedFiles[1].size,
        postId: 123,
      });
    });

    it('should handle empty file list', async () => {
      // Arrange
      const command = new UploadFilesCreatedPostCommand(123, []);
      (mockFilesService.uploadFiles as jest.Mock).mockResolvedValue([]);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockFilesService.uploadFiles).toHaveBeenCalledWith(
        'posts',
        123,
        [],
      );
      expect(mockFileRepository.createFile).not.toHaveBeenCalled();
    });

    it('should handle upload service failure', async () => {
      // Arrange
      const command = new UploadFilesCreatedPostCommand(123, mockFiles);
      const error = new Error('Upload failed');
      (mockFilesService.uploadFiles as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Upload failed');
      expect(mockFileRepository.createFile).not.toHaveBeenCalled();
    });

    it('should handle repository save failure', async () => {
      // Arrange
      const command = new UploadFilesCreatedPostCommand(123, mockFiles);
      (mockFilesService.uploadFiles as jest.Mock).mockResolvedValue(
        mockUploadedFiles,
      );
      const error = new Error('Database save failed');
      (mockFileRepository.createFile as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'Database save failed',
      );
    });
  });
});
