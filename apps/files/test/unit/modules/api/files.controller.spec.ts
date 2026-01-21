import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InternalApiGuard } from '@files/core/guards/internal/internal-api.guard';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import { FilesController } from '@files/modules/post-files/api/post-files.controller';
import { GetAllFilesByPostUserQuery } from '@files/modules/post-files/application/queries/get-all-files-by-post.query-handler';
import { DeletedPostFileCommand } from '@files/modules/post-files/application/commands/deleted-post-file.command-handler';
import { UploadFilesCreatedPostCommand } from '@files/modules/post-files/application/commands/upload-post-file.command-handler';

describe('FilesController', () => {
  let controller: FilesController;
  let mockCommandBus: CommandBus;
  let mockQueryBus: QueryBus;
  let mockLogger: AppLoggerService;

  const mockFiles = [
    {
      fieldname: 'files',
      originalname: 'test1.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test buffer 1'),
      size: 1024,
      stream: null,
      destination: '',
      filename: 'test1.jpg',
      path: '/tmp/test1.jpg',
    },
    {
      fieldname: 'files',
      originalname: 'test2.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('test buffer 2'),
      size: 2048,
      stream: null,
      destination: '',
      filename: 'test2.png',
      path: '/tmp/test2.png',
    },
  ];

  const mockOutputFiles: OutputFileType[] = [
    { id: 1, url: 'https://example.com/file1.jpg', postId: 123 },
    { id: 2, url: 'https://example.com/file2.png', postId: 123 },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
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
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(InternalApiGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FilesController>(FilesController);
    mockCommandBus = module.get<CommandBus>(CommandBus);
    mockQueryBus = module.get<QueryBus>(QueryBus);
    mockLogger = module.get<AppLoggerService>(AppLoggerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadPostFiles', () => {
    it('should upload files and return file list', async () => {
      // Arrange
      const dto = { postId: '123' };
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined);
      (mockQueryBus.execute as jest.Mock).mockResolvedValue(mockOutputFiles);

      // Act
      const result = await controller.uploadPostFiles(mockFiles, dto);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new UploadFilesCreatedPostCommand(123, mockFiles),
      );
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        new GetAllFilesByPostUserQuery(123),
      );
      expect(result).toEqual(mockOutputFiles);
    });

    it('should handle upload command failure', async () => {
      // Arrange
      const dto = { postId: '123' };
      const error = new Error('Upload failed');
      (mockCommandBus.execute as jest.Mock).mockRejectedValue(error);
      (mockQueryBus.execute as jest.Mock).mockResolvedValue([]);

      // Act & Assert
      await expect(controller.uploadPostFiles(mockFiles, dto)).rejects.toThrow(
        'Upload failed',
      );
    });
  });

  describe('deletePostFiles', () => {
    it('should delete files and return true on success', async () => {
      // Arrange
      const postId = 123;
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await controller.deletePostFiles(postId);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new DeletedPostFileCommand(123),
      );
      expect(result).toBe(true);
    });

    it('should return false and log error on delete failure', async () => {
      // Arrange
      const postId = 123;
      const error = new Error('Delete failed');
      (mockCommandBus.execute as jest.Mock).mockRejectedValue(error);

      // Act
      const result = await controller.deletePostFiles(postId);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new DeletedPostFileCommand(123),
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete post files',
        error.stack,
        FilesController.name,
      );
      expect(result).toBe(false);
    });
  });

  describe('getAllUserPostsFiles', () => {
    it('should return all files for given post IDs', async () => {
      // Arrange
      const dto = { postIds: [123, 456] };
      const filesForPost123 = [
        { id: 1, url: 'https://example.com/file1.jpg', postId: 123 },
      ];
      const filesForPost456 = [
        { id: 2, url: 'https://example.com/file2.png', postId: 456 },
        { id: 3, url: 'https://example.com/file3.jpg', postId: 456 },
      ];

      (mockQueryBus.execute as jest.Mock)
        .mockResolvedValueOnce(filesForPost123)
        .mockResolvedValueOnce(filesForPost456);

      // Act
      const result = await controller.getAllUserPostsFiles(dto);

      // Assert
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        new GetAllFilesByPostUserQuery(123),
      );
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        new GetAllFilesByPostUserQuery(456),
      );
      expect(result).toEqual([...filesForPost123, ...filesForPost456]);
    });

    it('should handle empty file lists for some posts', async () => {
      // Arrange
      const dto = { postIds: [123, 456] };
      (mockQueryBus.execute as jest.Mock)
        .mockResolvedValueOnce(mockOutputFiles)
        .mockResolvedValueOnce([]);

      // Act
      const result = await controller.getAllUserPostsFiles(dto);

      // Assert
      expect(result).toEqual(mockOutputFiles);
    });

    it('should return empty array when no posts provided', async () => {
      // Arrange
      const dto = { postIds: [] };

      // Act
      const result = await controller.getAllUserPostsFiles(dto);

      // Assert
      expect(mockQueryBus.execute).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
