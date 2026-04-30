import { Test, TestingModule } from '@nestjs/testing';
import { PostFilesRepository } from '@lumio/modules/posts/domain/infrastructure/post-files.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('PostFilesRepository', () => {
  let repository: PostFilesRepository;

  const mockPrisma = {
    postFile: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostFilesRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(PostFilesRepository);
    jest.clearAllMocks();
  });

  describe('createPostFiles', () => {
    it('should create multiple post files', async () => {
      const files = [
        { url: 'https://example.com/file1.jpg' },
        { url: 'https://example.com/file2.jpg' },
      ];
      mockPrisma.postFile.createMany.mockResolvedValue({ count: 2 });

      await repository.createPostFiles('post-1', files);

      expect(mockPrisma.postFile.createMany).toHaveBeenCalledWith({
        data: [
          { postId: 'post-1', url: 'https://example.com/file1.jpg' },
          { postId: 'post-1', url: 'https://example.com/file2.jpg' },
        ],
      });
    });

    it('should use transaction client when provided', async () => {
      const files = [{ url: 'https://example.com/file.jpg' }];
      const tx = {
        postFile: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      };

      await repository.createPostFiles('post-1', files, tx);

      expect(tx.postFile.createMany).toHaveBeenCalled();
      expect(mockPrisma.postFile.createMany).not.toHaveBeenCalled();
    });

    it('should handle empty files array', async () => {
      mockPrisma.postFile.createMany.mockResolvedValue({ count: 0 });

      await repository.createPostFiles('post-1', []);

      expect(mockPrisma.postFile.createMany).toHaveBeenCalledWith({
        data: [],
      });
    });
  });

  describe('deletePostFilesByPostId', () => {
    it('should delete all files for a post', async () => {
      mockPrisma.postFile.deleteMany.mockResolvedValue({ count: 3 });

      await repository.deletePostFilesByPostId('post-1');

      expect(mockPrisma.postFile.deleteMany).toHaveBeenCalledWith({
        where: { postId: 'post-1' },
      });
    });

    it('should handle non-existent post gracefully', async () => {
      mockPrisma.postFile.deleteMany.mockResolvedValue({ count: 0 });

      await repository.deletePostFilesByPostId('non-existent');

      expect(mockPrisma.postFile.deleteMany).toHaveBeenCalledWith({
        where: { postId: 'non-existent' },
      });
    });
  });
});
