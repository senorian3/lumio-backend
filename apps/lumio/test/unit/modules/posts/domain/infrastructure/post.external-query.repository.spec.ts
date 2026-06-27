import { Test, TestingModule } from '@nestjs/testing';
import { ExternalQueryPostsRepository } from '@lumio/modules/posts/domain/infrastructure/post.external-query.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('ExternalQueryPostsRepository', () => {
  let repository: ExternalQueryPostsRepository;

  const mockPrisma = {
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    postLike: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalQueryPostsRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(ExternalQueryPostsRepository);
    jest.clearAllMocks();
  });

  describe('getPostsByUserIds', () => {
    it('should return posts and total count for given user ids', async () => {
      const mockPosts = [
        { id: 'post-1', userId: 1, files: [] },
        { id: 'post-2', userId: 2, files: [] },
      ];
      mockPrisma.post.findMany.mockResolvedValue(mockPosts);
      mockPrisma.post.count.mockResolvedValue(2);

      const result = await repository.getPostsByUserIds([1, 2], 0, 10);

      expect(result).toEqual({ posts: mockPosts, totalCount: 2 });
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: {
          userId: { in: [1, 2] },
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
        include: {
          files: true,
          user: {
            include: {
              profile: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });
      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: {
          userId: { in: [1, 2] },
          deletedAt: null,
        },
      });
    });

    it('should return empty array when no posts found', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      const result = await repository.getPostsByUserIds([999], 0, 10);

      expect(result).toEqual({ posts: [], totalCount: 0 });
    });

    it('should handle pagination correctly', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(50);

      await repository.getPostsByUserIds([1], 20, 10);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });
  });

  describe('getUsersReactionsForPosts', () => {
    it('should return reactions map', async () => {
      const mockReactions = [
        { postId: 'post-1', status: 'like' },
        { postId: 'post-3', status: 'dislike' },
      ];
      mockPrisma.postLike.findMany.mockResolvedValue(mockReactions);
      const result = await repository.getUsersReactionsForPosts(
        ['post-1', 'post-3'],
        1,
      );
      expect(result.get('post-1')).toBe('like');
      expect(result.get('post-3')).toBe('dislike');
    });
  });
});
