import { Test, TestingModule } from '@nestjs/testing';
import { OutputFileType } from '@libs/dto/output/file-output';
import {
  GetAllFilesByUserIdQueryHandler,
  GetAllFilesByUserIdQuery,
} from '@files/modules/post-files/application/queries/get-all-files-by-user-id.query-handler';
import { PostFileEntity } from '@files/modules/post-files/domain/entities/post-file.entity';
import { QueryFileRepository } from '@files/modules/post-files/domain/infrastructure/file.query.repository';

describe('GetAllFilesByUserIdQueryHandler', () => {
  let handler: GetAllFilesByUserIdQueryHandler;
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
      userId: 1,
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
      userId: 1,
    },
  ];

  const expectedOutputFiles: OutputFileType[] = [
    { id: 1, url: 'https://example.com/file1.jpg', postId: '123' },
    { id: 2, url: 'https://example.com/file2.png', postId: '456' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllFilesByUserIdQueryHandler,
        {
          provide: QueryFileRepository,
          useValue: {
            getAllFilesByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetAllFilesByUserIdQueryHandler>(
      GetAllFilesByUserIdQueryHandler,
    );
    mockQueryRepository = module.get<QueryFileRepository>(QueryFileRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return mapped files for given user ID', async () => {
      // Arrange
      const query = new GetAllFilesByUserIdQuery(1, 1, 50);
      (mockQueryRepository.getAllFilesByUserId as jest.Mock).mockResolvedValue(
        mockPostFiles,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockQueryRepository.getAllFilesByUserId).toHaveBeenCalledWith(
        1,
        1,
        50,
      );
      expect(result).toEqual(expectedOutputFiles);
    });

    it('should return empty array when no files found', async () => {
      // Arrange
      const query = new GetAllFilesByUserIdQuery(999, 1, 50);
      (mockQueryRepository.getAllFilesByUserId as jest.Mock).mockResolvedValue(
        [],
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockQueryRepository.getAllFilesByUserId).toHaveBeenCalledWith(
        999,
        1,
        50,
      );
      expect(result).toEqual([]);
    });

    it('should handle repository error', async () => {
      // Arrange
      const query = new GetAllFilesByUserIdQuery(1, 1, 50);
      const error = new Error('Database query failed');
      (mockQueryRepository.getAllFilesByUserId as jest.Mock).mockRejectedValue(
        error,
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        'Database query failed',
      );
    });

    it('should correctly map file entities to output DTOs', async () => {
      // Arrange
      const query = new GetAllFilesByUserIdQuery(1, 1, 50);
      const singleFile = [mockPostFiles[0]];
      (mockQueryRepository.getAllFilesByUserId as jest.Mock).mockResolvedValue(
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
      expect(result[0]).not.toHaveProperty('userId');
    });
  });
});
