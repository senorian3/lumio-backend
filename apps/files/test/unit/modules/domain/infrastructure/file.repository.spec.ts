import { Test, TestingModule } from '@nestjs/testing';
import { FileRepository } from '@files/modules/domain/infrastructure/file.repository';
import { PrismaService } from '@files/prisma/prisma.service';
import { PostFileEntity } from '@files/modules/domain/entities/post-file.entity';

describe('FileRepository', () => {
  let repository: FileRepository;
  let mockPrisma: PrismaService;

  const mockPostFile: PostFileEntity = {
    id: 1,
    key: 'content/posts/123/file1.jpg',
    url: 'https://example.com/file1.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    createdAt: new Date(),
    deletedAt: null,
    postId: 123,
  };

  const createFileDto = {
    key: 'content/posts/123/file1.jpg',
    url: 'https://example.com/file1.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    postId: 123,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileRepository,
        {
          provide: PrismaService,
          useValue: {
            postFile: {
              create: jest.fn(),
              updateMany: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<FileRepository>(FileRepository);
    mockPrisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createFile', () => {
    it('should create a new file record', async () => {
      // Arrange
      (mockPrisma.postFile.create as jest.Mock).mockResolvedValue(mockPostFile);

      // Act
      const result = await repository.createFile(createFileDto);

      // Assert
      expect(mockPrisma.postFile.create).toHaveBeenCalledWith({
        data: createFileDto,
      });
      expect(result).toEqual(mockPostFile);
    });

    it('should handle database creation error', async () => {
      // Arrange
      const error = new Error('Database create failed');
      (mockPrisma.postFile.create as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.createFile(createFileDto)).rejects.toThrow(
        'Database create failed',
      );
    });
  });

  describe('softDeleteFilesByPostId', () => {
    it('should soft delete files for given post ID', async () => {
      // Arrange
      const postId = 123;
      (mockPrisma.postFile.updateMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      // Act
      await repository.softDeleteFilesByPostId(postId);

      // Assert
      expect(mockPrisma.postFile.updateMany).toHaveBeenCalledWith({
        where: { postId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should handle database update error', async () => {
      // Arrange
      const postId = 123;
      const error = new Error('Database update failed');
      (mockPrisma.postFile.updateMany as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.softDeleteFilesByPostId(postId)).rejects.toThrow(
        'Database update failed',
      );
    });
  });

  describe('findFilesByPostId', () => {
    it('should return files for given post ID excluding deleted ones', async () => {
      // Arrange
      const postId = 123;
      const mockFiles = [mockPostFile];
      (mockPrisma.postFile.findMany as jest.Mock).mockResolvedValue(mockFiles);

      // Act
      const result = await repository.findFilesByPostId(postId);

      // Assert
      expect(mockPrisma.postFile.findMany).toHaveBeenCalledWith({
        where: {
          postId,
          deletedAt: null,
        },
        take: 10,
      });
      expect(result).toEqual(mockFiles);
    });

    it('should return empty array when no files found', async () => {
      // Arrange
      const postId = 456;
      (mockPrisma.postFile.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await repository.findFilesByPostId(postId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database query error', async () => {
      // Arrange
      const postId = 123;
      const error = new Error('Database query failed');
      (mockPrisma.postFile.findMany as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findFilesByPostId(postId)).rejects.toThrow(
        'Database query failed',
      );
    });
  });
});
