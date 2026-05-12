import { Test, TestingModule } from '@nestjs/testing';
import { PostsQueryRepository } from '@super-admin/modules/posts/domain/infrastructure/posts.query-repository';
import { PrismaService } from '@super-admin/prisma/prisma.service';
import { PostSortBy } from '@super-admin/modules/posts/domain/schema/post/post-sort-by.enum';

describe('PostsQueryRepository', () => {
  let repository: PostsQueryRepository;
  let prisma: {
    post: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  const mockPost = {
    id: 1,
    description: 'Test post',
    createdAt: new Date('2026-01-01'),
    deletedAt: null,
    userId: 1,
    user: { id: 1, username: 'testuser' },
    files: [{ id: 1, url: 'file1.jpg', deletedAt: null }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsQueryRepository,
        {
          provide: PrismaService,
          useValue: {
            post: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<PostsQueryRepository>(PostsQueryRepository);
    prisma = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPosts', () => {
    it('should find posts with default sort', async () => {
      prisma.post.findMany.mockResolvedValue([mockPost]);

      const result = await repository.findPosts(1, 10, PostSortBy.DATE_DESC);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
            files: {
              where: { deletedAt: null },
            },
          },
        }),
      );
    });

    it('should search posts by username', async () => {
      prisma.post.findMany.mockResolvedValue([]);

      await repository.findPosts(1, 10, PostSortBy.DATE_DESC, 'testuser');

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            user: {
              username: {
                contains: 'testuser',
              },
            },
          },
        }),
      );
    });

    it('should calculate skip correctly for pagination', async () => {
      prisma.post.findMany.mockResolvedValue([]);

      await repository.findPosts(3, 10, PostSortBy.DATE_DESC);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10 = 20
          take: 10,
        }),
      );
    });

    it('should sort by DATE_ASC', async () => {
      prisma.post.findMany.mockResolvedValue([]);

      await repository.findPosts(1, 10, PostSortBy.DATE_ASC);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should sort by USERNAME_ASC', async () => {
      prisma.post.findMany.mockResolvedValue([]);

      await repository.findPosts(1, 10, PostSortBy.USERNAME_ASC);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { user: { username: 'asc' } },
        }),
      );
    });

    it('should sort by USERNAME_DESC', async () => {
      prisma.post.findMany.mockResolvedValue([]);

      await repository.findPosts(1, 10, PostSortBy.USERNAME_DESC);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { user: { username: 'desc' } },
        }),
      );
    });
  });

  describe('countPosts', () => {
    it('should count all posts', async () => {
      prisma.post.count.mockResolvedValue(10);

      const result = await repository.countPosts();

      expect(result).toBe(10);
      expect(prisma.post.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });

    it('should count posts with search', async () => {
      prisma.post.count.mockResolvedValue(1);

      const result = await repository.countPosts('testuser');

      expect(result).toBe(1);
      expect(prisma.post.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            user: {
              username: {
                contains: 'testuser',
              },
            },
          },
        }),
      );
    });
  });
});
