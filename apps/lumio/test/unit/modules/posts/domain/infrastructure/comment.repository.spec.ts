import { Test, TestingModule } from '@nestjs/testing';
import { CommentRepository } from '@lumio/modules/posts/domain/infrastructure/comment.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('CommentRepository', () => {
  let repository: CommentRepository;

  const mockPrisma = {
    post: {
      findFirst: jest.fn(),
    },
    comment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    commentLike: {
      deleteMany: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(CommentRepository);
    jest.clearAllMocks();
  });

  describe('findExistingAndActivePost', () => {
    it('should find an active post by id', async () => {
      const mockPost = { id: 'post-1', deletedAt: null };
      mockPrisma.post.findFirst.mockResolvedValue(mockPost);

      const result = await repository.findExistingAndActivePost('post-1');

      expect(result).toEqual(mockPost);
      expect(mockPrisma.post.findFirst).toHaveBeenCalledWith({
        where: { id: 'post-1', deletedAt: null },
      });
    });

    it('should return null when post is not found', async () => {
      mockPrisma.post.findFirst.mockResolvedValue(null);

      const result = await repository.findExistingAndActivePost('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findActiveCommentById', () => {
    it('should find an active comment by id', async () => {
      const mockComment = { id: 1, deletedAt: null, content: 'Test' };
      mockPrisma.comment.findFirst.mockResolvedValue(mockComment);

      const result = await repository.findActiveCommentById(1);

      expect(result).toEqual(mockComment);
      expect(mockPrisma.comment.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
      });
    });

    it('should return null when comment is not found', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(null);

      const result = await repository.findActiveCommentById(999);

      expect(result).toBeNull();
    });
  });

  describe('createComment', () => {
    it('should create a comment without parentId', async () => {
      mockPrisma.comment.findFirst.mockResolvedValue(null);
      mockPrisma.comment.create.mockResolvedValue({ id: 1 });

      const result = await repository.createComment(
        1,
        'post-1',
        'Test content',
      );

      expect(result).toEqual({ commentId: 1 });
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'Test content',
          postId: 'post-1',
          rootId: null,
          userId: 1,
        },
        select: { id: true },
      });
    });

    it('should create a comment with parentId', async () => {
      mockPrisma.comment.findFirst.mockResolvedValueOnce({
        id: 2,
        rootId: null,
      });
      mockPrisma.comment.create.mockResolvedValue({ id: 3 });

      const result = await repository.createComment(1, 'post-1', 'Reply', 2);

      expect(result).toEqual({ commentId: 3 });
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'Reply',
          postId: 'post-1',
          userId: 1,
          parentId: 2,
          rootId: 2,
        },
        select: { id: true },
      });
    });

    it('should resolve rootId from parent when parent has rootId', async () => {
      mockPrisma.comment.findFirst.mockResolvedValueOnce({
        id: 2,
        rootId: 1,
      });
      mockPrisma.comment.create.mockResolvedValue({ id: 3 });

      const result = await repository.createComment(1, 'post-1', 'Reply', 2);

      expect(result).toEqual({ commentId: 3 });
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'Reply',
          postId: 'post-1',
          userId: 1,
          parentId: 2,
          rootId: 1,
        },
        select: { id: true },
      });
    });
  });

  describe('updateCommentLike', () => {
    it('should delete like when status is none', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          commentLike: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            upsert: jest.fn(),
            count: jest.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(0),
          },
          comment: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      await repository.updateCommentLike(1, 1, 'none');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should upsert like when status is like', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          commentLike: {
            deleteMany: jest.fn(),
            upsert: jest.fn().mockResolvedValue({}),
            count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
          },
          comment: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      await repository.updateCommentLike(1, 1, 'like');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should upsert dislike when status is dislike', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          commentLike: {
            deleteMany: jest.fn(),
            upsert: jest.fn().mockResolvedValue({}),
            count: jest.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(1),
          },
          comment: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      await repository.updateCommentLike(1, 1, 'dislike');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
