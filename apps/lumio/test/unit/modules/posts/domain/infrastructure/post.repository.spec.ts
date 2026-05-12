import { Test, TestingModule } from '@nestjs/testing';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('PostRepository', () => {
  let repository: PostRepository;
  let prisma: any;

  const mockPost = {
    id: 'post-123',
    userId: 1,
    description: 'Test post',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    likeCount: 0,
    dislikeCount: 0,
    user: { id: 1, username: 'testuser' },
    files: [],
  };

  beforeEach(async () => {
    const mockPrisma = {
      post: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      postLike: {
        deleteMany: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<PostRepository>(PostRepository);
    prisma = module.get(PrismaService);
  });

  describe('createPost', () => {
    it('should create a post', async () => {
      prisma.post.create.mockResolvedValue(mockPost);

      const result = await repository.createPost(1, 'post-123', 'Test post');

      expect(result).toEqual(mockPost);
      expect(prisma.post.create).toHaveBeenCalledWith({
        data: { userId: 1, description: 'Test post', id: 'post-123' },
        include: { user: true, files: true },
      });
    });

    it('should use transaction client when provided', async () => {
      const tx = { post: { create: jest.fn().mockResolvedValue(mockPost) } };

      const result = await repository.createPost(
        1,
        'post-123',
        'Test post',
        tx,
      );

      expect(result).toEqual(mockPost);
      expect(tx.post.create).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find a post by id', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);

      const result = await repository.findById('post-123');

      expect(result).toEqual(mockPost);
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-123' },
        include: { user: true, files: true },
      });
    });

    it('should return null when post not found', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateDescription', () => {
    it('should update post description', async () => {
      const updatedPost = { ...mockPost, description: 'Updated description' };
      prisma.post.update.mockResolvedValue(updatedPost);

      const result = await repository.updateDescription(
        'post-123',
        'Updated description',
      );

      expect(result).toEqual(updatedPost);
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-123' },
        data: { description: 'Updated description' },
        include: { user: true, files: true },
      });
    });
  });

  describe('softDeletePostById', () => {
    it('should soft delete a post', async () => {
      prisma.post.update.mockResolvedValue(mockPost);

      await repository.softDeletePostById('post-123');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('findActivePostById', () => {
    it('should find active post by id', async () => {
      prisma.post.findFirst.mockResolvedValue(mockPost);

      const result = await repository.findActivePostById('post-123');

      expect(result).toEqual(mockPost);
      expect(prisma.post.findFirst).toHaveBeenCalledWith({
        where: { id: 'post-123', deletedAt: null },
      });
    });

    it('should return null for deleted post', async () => {
      prisma.post.findFirst.mockResolvedValue(null);

      const result = await repository.findActivePostById('deleted-post');

      expect(result).toBeNull();
    });
  });

  describe('updatePostLike', () => {
    it('should add like to a post', async () => {
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          postLike: {
            deleteMany: jest.fn(),
            upsert: jest.fn(),
            count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
          },
          post: {
            update: jest.fn(),
          },
        };
        return cb(tx);
      });

      await repository.updatePostLike('post-123', 1, 'like' as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should remove like when status is none', async () => {
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          postLike: {
            deleteMany: jest.fn(),
            upsert: jest.fn(),
            count: jest.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(0),
          },
          post: {
            update: jest.fn(),
          },
        };
        return cb(tx);
      });

      await repository.updatePostLike('post-123', 1, 'none' as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
