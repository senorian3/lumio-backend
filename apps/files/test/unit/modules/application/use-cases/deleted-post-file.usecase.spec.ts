import { FilesService } from '@files/core/services/s3-files-http.adapter';
import {
  DeletedPostFileCommandHandler,
  DeletedPostFileCommand,
} from '@files/modules/post-files/application/commands/deleted-post-file.command-handler';
import { PostFileEntity } from '@files/modules/post-files/domain/entities/post-file.entity';
import { FileRepository } from '@files/modules/post-files/domain/infrastructure/file.repository';
import { Test, TestingModule } from '@nestjs/testing';

describe('DeletedPostFileCommandHandler', () => {
  let useCase: DeletedPostFileCommandHandler;
  let mockFilesService: FilesService;
  let mockFileRepository: FileRepository;

  const mockPostFiles: PostFileEntity[] = [
    {
      id: 1,
      key: 'content/posts/123/file1.jpg',
      url: 'https://example.com/file1.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      createdAt: new Date(),
      deletedAt: null,
      postId: 123,
    },
    {
      id: 2,
      key: 'content/posts/123/file2.png',
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
        DeletedPostFileCommandHandler,
        {
          provide: FilesService,
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
      ],
    }).compile();

    useCase = module.get<DeletedPostFileCommandHandler>(
      DeletedPostFileCommandHandler,
    );
    mockFilesService = module.get<FilesService>(FilesService);
    mockFileRepository = module.get<FileRepository>(FileRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should delete all files for a post from S3 and soft delete from database', async () => {
      // Arrange
      const command = new DeletedPostFileCommand(123);
      (mockFileRepository.findFilesByPostId as jest.Mock).mockResolvedValue(
        mockPostFiles,
      );
      (mockFilesService.deleteFile as jest.Mock).mockResolvedValue(undefined);
      (
        mockFileRepository.softDeleteFilesByPostId as jest.Mock
      ).mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockFileRepository.findFilesByPostId).toHaveBeenCalledWith(123);
      expect(mockFilesService.deleteFile).toHaveBeenCalledTimes(2);
      expect(mockFilesService.deleteFile).toHaveBeenCalledWith(
        mockPostFiles[0].key,
      );
      expect(mockFilesService.deleteFile).toHaveBeenCalledWith(
        mockPostFiles[1].key,
      );
      expect(mockFileRepository.softDeleteFilesByPostId).toHaveBeenCalledWith(
        123,
      );
    });

    it('should handle post with no files', async () => {
      // Arrange
      const command = new DeletedPostFileCommand(123);
      (mockFileRepository.findFilesByPostId as jest.Mock).mockResolvedValue([]);
      (mockFilesService.deleteFile as jest.Mock).mockResolvedValue(undefined);
      (
        mockFileRepository.softDeleteFilesByPostId as jest.Mock
      ).mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockFileRepository.findFilesByPostId).toHaveBeenCalledWith(123);
      expect(mockFilesService.deleteFile).not.toHaveBeenCalled();
      expect(mockFileRepository.softDeleteFilesByPostId).toHaveBeenCalledWith(
        123,
      );
    });

    it('should handle S3 delete failure for one file', async () => {
      // Arrange
      const command = new DeletedPostFileCommand(123);
      (mockFileRepository.findFilesByPostId as jest.Mock).mockResolvedValue(
        mockPostFiles,
      );
      const error = new Error('S3 delete failed');
      (mockFilesService.deleteFile as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(error);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'S3 delete failed',
      );
      expect(mockFileRepository.softDeleteFilesByPostId).not.toHaveBeenCalled();
    });

    it('should handle repository find failure', async () => {
      // Arrange
      const command = new DeletedPostFileCommand(123);
      const error = new Error('Database find failed');
      (mockFileRepository.findFilesByPostId as jest.Mock).mockRejectedValue(
        error,
      );

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'Database find failed',
      );
      expect(mockFilesService.deleteFile).not.toHaveBeenCalled();
      expect(mockFileRepository.softDeleteFilesByPostId).not.toHaveBeenCalled();
    });

    it('should handle repository soft delete failure', async () => {
      // Arrange
      const command = new DeletedPostFileCommand(123);
      (mockFileRepository.findFilesByPostId as jest.Mock).mockResolvedValue(
        mockPostFiles,
      );
      (mockFilesService.deleteFile as jest.Mock).mockResolvedValue(undefined);
      const error = new Error('Database soft delete failed');
      (
        mockFileRepository.softDeleteFilesByPostId as jest.Mock
      ).mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'Database soft delete failed',
      );
    });
  });
});
