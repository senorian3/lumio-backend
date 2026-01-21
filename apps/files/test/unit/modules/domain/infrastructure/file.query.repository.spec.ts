import { PostFileEntity } from '@files/modules/post-files/domain/entities/post-file.entity';
import { QueryFileRepository } from '@files/modules/post-files/domain/infrastructure/file.query.repository';
import { PrismaService } from '@files/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('QueryFileRepository', () => {
  let repository: QueryFileRepository;
  let mockPrisma: PrismaService;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryFileRepository,
        {
          provide: PrismaService,
          useValue: {
            postFile: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<QueryFileRepository>(QueryFileRepository);
    mockPrisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getAllFilesByPostId', () => {
    it('should return all files for given post ID ordered by creation date', async () => {
      // Arrange
      const postId = 123;
      (mockPrisma.postFile.findMany as jest.Mock).mockResolvedValue(
        mockPostFiles,
      );

      // Act
      const result = await repository.getAllFilesByPostId(postId);

      // Assert
      expect(mockPrisma.postFile.findMany).toHaveBeenCalledWith({
        where: {
          postId: postId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      expect(result).toEqual(mockPostFiles);
    });

    it('should return empty array when no files found', async () => {
      // Arrange
      const postId = 456;
      (mockPrisma.postFile.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await repository.getAllFilesByPostId(postId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database query error', async () => {
      // Arrange
      const postId = 123;
      const error = new Error('Database query failed');
      (mockPrisma.postFile.findMany as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.getAllFilesByPostId(postId)).rejects.toThrow(
        'Database query failed',
      );
    });

    it('should return files including soft deleted ones', async () => {
      // Arrange
      const postId = 123;
      const filesWithDeleted = [
        ...mockPostFiles,
        {
          id: 3,
          key: 'content/posts/123/deleted.jpg',
          url: 'https://example.com/deleted.jpg',
          mimetype: 'image/jpeg',
          size: 512,
          createdAt: new Date('2023-01-03'),
          deletedAt: new Date('2023-01-04'),
          postId: 123,
        },
      ];
      (mockPrisma.postFile.findMany as jest.Mock).mockResolvedValue(
        filesWithDeleted,
      );

      // Act
      const result = await repository.getAllFilesByPostId(postId);

      // Assert
      expect(result).toEqual(filesWithDeleted);
      expect(result).toHaveLength(3);
    });
  });
});
