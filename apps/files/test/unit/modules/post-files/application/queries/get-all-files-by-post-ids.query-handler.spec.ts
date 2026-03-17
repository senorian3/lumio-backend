import { Test, TestingModule } from '@nestjs/testing';
import { OutputFileType } from '@libs/dto/output/file-output';
import {
  GetAllFilesByPostIdsQueryHandler,
  GetAllFilesByPostIdsQuery,
} from '@files/modules/post-files/application/queries/get-all-files-by-post-ids.query-handler';
import { PostFileEntity } from '@files/modules/post-files/domain/entities/post-file.entity';
import { QueryFileRepository } from '@files/modules/post-files/domain/infrastructure/file.query.repository';

describe('GetAllFilesByPostIdsQueryHandler', () => {
  let handler: GetAllFilesByPostIdsQueryHandler;
  let mockQueryRepository: QueryFileRepository;

  const mockPostFiles: PostFileEntity[] = [
    {
      id: 1,
      key: 'content/posts/123/file1.jpg',
      url: 'https://example.com/file1.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      createdAt: new Date('2023-01-01'),
      deletedAt: null,
      postId: '123',
    },
    {
      id: 2,
      key: 'content/posts/456/file2.png',
      url: 'https://example.com/file2.png',
      mimetype: 'image/png',
      size: 2048,
      createdAt: new Date('2023-01-02'),
      deletedAt: null,
      postId: '456',
    },
  ];

  const expectedOutputFiles: OutputFileType[] = [
    { id: 1, url: 'https://example.com/file1.jpg', postId: '123' },
    { id: 2, url: 'https://example.com/file2.png', postId: '456' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllFilesByPostIdsQueryHandler,
        {
          provide: QueryFileRepository,
          useValue: {
            getAllFilesByPostIds: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetAllFilesByPostIdsQueryHandler>(
      GetAllFilesByPostIdsQueryHandler,
    );
    mockQueryRepository = module.get<QueryFileRepository>(QueryFileRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return mapped files for given post IDs', async () => {
      // Arrange
      const query = new GetAllFilesByPostIdsQuery(['123', '456']);
      (mockQueryRepository.getAllFilesByPostIds as jest.Mock).mockResolvedValue(
        mockPostFiles,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockQueryRepository.getAllFilesByPostIds).toHaveBeenCalledWith([
        '123',
        '456',
      ]);
      expect(result).toEqual(expectedOutputFiles);
    });

    it('should return empty array when no files found', async () => {
      // Arrange
      const query = new GetAllFilesByPostIdsQuery(['999']);
      (mockQueryRepository.getAllFilesByPostIds as jest.Mock).mockResolvedValue(
        [],
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockQueryRepository.getAllFilesByPostIds).toHaveBeenCalledWith([
        '999',
      ]);
      expect(result).toEqual([]);
    });

    it('should handle repository error', async () => {
      // Arrange
      const query = new GetAllFilesByPostIdsQuery(['123']);
      const error = new Error('Database query failed');
      (mockQueryRepository.getAllFilesByPostIds as jest.Mock).mockRejectedValue(
        error,
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        'Database query failed',
      );
    });
  });
});
