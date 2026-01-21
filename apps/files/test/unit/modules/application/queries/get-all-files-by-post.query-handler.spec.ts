import { Test, TestingModule } from '@nestjs/testing';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';
import {
  GetAllFilesByPostUserQueryHandler,
  GetAllFilesByPostUserQuery,
} from '@files/modules/post-files/application/queries/get-all-files-by-post.query-handler';
import { PostFileEntity } from '@files/modules/post-files/domain/entities/post-file.entity';
import { QueryFileRepository } from '@files/modules/post-files/domain/infrastructure/file.query.repository';

describe('GetAllFilesByPostUserQueryHandler', () => {
  let handler: GetAllFilesByPostUserQueryHandler;
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
      postId: 123,
    },
    {
      id: 2,
      key: 'content/posts/123/file2.png',
      url: 'https://example.com/file2.png',
      mimetype: 'image/png',
      size: 2048,
      createdAt: new Date('2023-01-02'),
      deletedAt: null,
      postId: 123,
    },
  ];

  const expectedOutputFiles: OutputFileType[] = [
    { id: 1, url: 'https://example.com/file1.jpg', postId: 123 },
    { id: 2, url: 'https://example.com/file2.png', postId: 123 },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllFilesByPostUserQueryHandler,
        {
          provide: QueryFileRepository,
          useValue: {
            getAllFilesByPostId: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetAllFilesByPostUserQueryHandler>(
      GetAllFilesByPostUserQueryHandler,
    );
    mockQueryRepository = module.get<QueryFileRepository>(QueryFileRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return mapped files for given post ID', async () => {
      // Arrange
      const query = new GetAllFilesByPostUserQuery(123);
      (mockQueryRepository.getAllFilesByPostId as jest.Mock).mockResolvedValue(
        mockPostFiles,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockQueryRepository.getAllFilesByPostId).toHaveBeenCalledWith(123);
      expect(result).toEqual(expectedOutputFiles);
    });

    it('should return empty array when no files found', async () => {
      // Arrange
      const query = new GetAllFilesByPostUserQuery(456);
      (mockQueryRepository.getAllFilesByPostId as jest.Mock).mockResolvedValue(
        [],
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockQueryRepository.getAllFilesByPostId).toHaveBeenCalledWith(456);
      expect(result).toEqual([]);
    });

    it('should handle repository error', async () => {
      // Arrange
      const query = new GetAllFilesByPostUserQuery(123);
      const error = new Error('Database query failed');
      (mockQueryRepository.getAllFilesByPostId as jest.Mock).mockRejectedValue(
        error,
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        'Database query failed',
      );
    });

    it('should correctly map file entities to output DTOs', async () => {
      // Arrange
      const query = new GetAllFilesByPostUserQuery(123);
      const singleFile = [mockPostFiles[0]];
      (mockQueryRepository.getAllFilesByPostId as jest.Mock).mockResolvedValue(
        singleFile,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockPostFiles[0].id,
        url: mockPostFiles[0].url,
        postId: mockPostFiles[0].postId,
      });
      expect(result[0]).not.toHaveProperty('key');
      expect(result[0]).not.toHaveProperty('mimetype');
      expect(result[0]).not.toHaveProperty('size');
      expect(result[0]).not.toHaveProperty('createdAt');
      expect(result[0]).not.toHaveProperty('deletedAt');
    });
  });
});
