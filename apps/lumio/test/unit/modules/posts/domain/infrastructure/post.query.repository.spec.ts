import { Test, TestingModule } from '@nestjs/testing';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('QueryPostRepository', () => {
  let repository: QueryPostRepository;
  const mockPostId = 'post-123';
  const mockUserId = 1;

  const mockPost = {
    id: mockPostId,
    description: 'Test post',
    createdAt: new Date(),
    deletedAt: null,
    userId: mockUserId,
    user: {
      id: mockUserId,
      username: 'testuser',
    },
    files: [],
  };

  const mockPrisma = {
    post: {
      findFirst: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    comment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    commentLike: {
      findMany: jest.fn(),
    },
    postLike: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryPostRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<QueryPostRepository>(QueryPostRepository);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find a post by id', async () => {
      mockPrisma.post.findFirst.mockResolvedValue(mockPost);

      const result = await repository.findById(mockPostId);

      expect(result).toEqual(mockPost);
      expect(mockPrisma.post.findFirst).toHaveBeenCalledWith({
        where: { id: mockPostId },
        include: {
          user: true,
          files: true,
        },
      });
    });

    it('should return null when post is not found', async () => {
      mockPrisma.post.findFirst.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true when post exists and is active', async () => {
      mockPrisma.post.count.mockResolvedValue(1);

      const result = await repository.exists(mockPostId);

      expect(result).toBe(true);
      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: {
          id: mockPostId,
          deletedAt: null,
        },
      });
    });

    it('should return false when post does not exist', async () => {
      mockPrisma.post.count.mockResolvedValue(0);

      const result = await repository.exists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('findCommentById', () => {
    it('should find an active comment by id', async () => {
      const mockComment = {
        id: 1,
        content: 'Test comment',
        likeCount: 0,
        dislikeCount: 0,
        createdAt: new Date(),
        deletedAt: null,
        userId: 2,
        postId: mockPostId,
        parentId: null,
        rootId: null,
      };
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);

      const result = await repository.findCommentById(1);

      expect(result).toEqual(mockComment);
      expect(mockPrisma.comment.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          deletedAt: null,
        },
      });
    });

    it('should return null when comment is not found', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(null);

      const result = await repository.findCommentById(999);

      expect(result).toBeNull();
    });
  });

  describe('findCommentsByPostId', () => {
    const mockRootComment = {
      id: 1,
      content: 'Root comment',
      likeCount: 2,
      dislikeCount: 0,
      createdAt: new Date(),
      deletedAt: null,
      userId: 2,
      postId: mockPostId,
      parentId: null,
      rootId: null,
      user: {
        id: 2,
        username: 'user2',
        profile: { avatarUrl: null },
      },
    };

    it('should return paginated comments for a post', async () => {
      mockPrisma.comment.findMany
        .mockResolvedValueOnce([mockRootComment])
        .mockResolvedValueOnce([]);
      mockPrisma.comment.count.mockResolvedValue(1);

      const result = await repository.findCommentsByPostId(mockPostId);

      expect(result).toBeInstanceOf(Object);
      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should return empty result when there are no comments', async () => {
      mockPrisma.comment.findMany.mockResolvedValueOnce([]);
      mockPrisma.comment.count.mockResolvedValue(0);

      const result = await repository.findCommentsByPostId(mockPostId);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should include user reactions when userId is provided', async () => {
      mockPrisma.comment.findMany
        .mockResolvedValueOnce([mockRootComment])
        .mockResolvedValueOnce([]);
      mockPrisma.comment.count.mockResolvedValue(1);
      mockPrisma.commentLike.findMany.mockResolvedValue([
        { commentId: 1, status: 'like' },
      ]);

      const result = await repository.findCommentsByPostId(
        mockPostId,
        undefined,
        mockUserId,
      );

      expect(result.items).toHaveLength(1);
      expect(mockPrisma.commentLike.findMany).toHaveBeenCalled();
    });
  });

  describe('findUserPosts', () => {
    it('should return paginated posts for a user', async () => {
      const mockPosts = [mockPost];
      mockPrisma.post.findMany.mockResolvedValue(mockPosts);
      mockPrisma.post.count.mockResolvedValue(1);
      mockPrisma.postLike.findMany.mockResolvedValue([]);

      const query = {
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        calculateSkip: () => 0,
      } as any;

      const result = await repository.findUserPosts(mockUserId, query);

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it('should return empty result when user has no posts', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      const query = {
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        calculateSkip: () => 0,
      } as any;

      const result = await repository.findUserPosts(mockUserId, query);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });
});
