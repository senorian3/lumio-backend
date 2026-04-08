import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { QueryPostRepository } from '@lumio/modules/posts/domain/infrastructure/post.query.repository';
import {
  GetPostByIdQueryHandler,
  GetPostByIdQuery,
} from '@lumio/modules/posts/application/queries/get-post-by-id.query-handler';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';

describe('GetPostByIdQueryHandler', () => {
  let handler: GetPostByIdQueryHandler;
  let mockQueryPostRepository: jest.Mocked<QueryPostRepository>;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;

  const mockUserId = 1;
  const mockPostId = '100';

  const mockPost = {
    id: 100,
    description: 'Test post description',
    createdAt: new Date('2024-01-01'),
    userId: mockUserId,
    files: [
      {
        id: 1,
        url: 'https://example.com/file1.jpg',
        postId: 100,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPostByIdQueryHandler,
        {
          provide: QueryPostRepository,
          useValue: {
            findById: jest.fn(),
            findUserReactionToPost: jest.fn().mockResolvedValue(null),
            findNewestLikesForPost: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: {
            findUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetPostByIdQueryHandler>(GetPostByIdQueryHandler);
    mockQueryPostRepository = module.get(QueryPostRepository);
    mockExternalQueryUserRepository = module.get(
      ExternalQueryUserAccountsRepository,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return post successfully when post and user exist', async () => {
      // Arrange
      const query = new GetPostByIdQuery(mockPostId, mockUserId);

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockQueryPostRepository.findById.mockResolvedValue(mockPost as any);
      mockQueryPostRepository.findUserReactionToPost.mockResolvedValue(null);
      mockQueryPostRepository.findNewestLikesForPost.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockQueryPostRepository.findById).toHaveBeenCalledWith(mockPostId);
      expect(
        mockQueryPostRepository.findUserReactionToPost,
      ).toHaveBeenCalledWith(mockPostId, mockUserId);
      expect(
        mockQueryPostRepository.findNewestLikesForPost,
      ).toHaveBeenCalledWith(mockPostId, 3);

      expect(result).toBeInstanceOf(PostView);
      expect(result.id).toBe(100);
      expect(result.description).toBe('Test post description');
      expect(result.userId).toBe(mockUserId);
      expect(result.postFiles).toHaveLength(1);
    });

    it('should return post with empty files when files array is empty', async () => {
      // Arrange
      const postWithoutFiles = {
        ...mockPost,
        files: [],
      };
      const query = new GetPostByIdQuery(mockPostId, mockUserId);

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockQueryPostRepository.findById.mockResolvedValue(
        postWithoutFiles as any,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.postFiles).toEqual([]);
    });

    it('should throw NotFoundDomainException when user does not exist', async () => {
      // Arrange
      const query = new GetPostByIdQuery(mockPostId, mockUserId);

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(null);

      // Act & Assert
      try {
        await handler.execute(query);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error).toBeInstanceOf(NotFoundDomainException);
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe('Profile is not found');
        expect(error.extensions[0]?.field).toBe('userId');
      }

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockQueryPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundDomainException when post does not exist', async () => {
      // Arrange
      const query = new GetPostByIdQuery(mockPostId, mockUserId);

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockQueryPostRepository.findById.mockResolvedValue(null);

      // Act & Assert
      try {
        await handler.execute(query);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe('Post does not exist');
        expect(error.extensions[0]?.field).toBe('post');
      }

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockQueryPostRepository.findById).toHaveBeenCalledWith(mockPostId);
    });

    it('should pass postId as string to repository', async () => {
      // Arrange
      const stringPostId = '200';
      const query = new GetPostByIdQuery(stringPostId, mockUserId);

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockQueryPostRepository.findById.mockResolvedValue(mockPost as any);

      // Act
      await handler.execute(query);

      // Assert
      expect(mockQueryPostRepository.findById).toHaveBeenCalledWith(
        stringPostId,
      );
    });

    it('should handle database error when finding user', async () => {
      // Arrange
      const query = new GetPostByIdQuery(mockPostId, mockUserId);
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.findUserId.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockQueryPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle database error when finding post', async () => {
      // Arrange
      const query = new GetPostByIdQuery(mockPostId, mockUserId);
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockQueryPostRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);

      expect(mockExternalQueryUserRepository.findUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockQueryPostRepository.findById).toHaveBeenCalledWith(mockPostId);
    });

    it('should correctly map multiple files to post view', async () => {
      // Arrange
      const postWithMultipleFiles = {
        ...mockPost,
        files: [
          { id: 1, url: 'https://example.com/file1.jpg', postId: 100 },
          { id: 2, url: 'https://example.com/file2.jpg', postId: 100 },
          { id: 3, url: 'https://example.com/file3.jpg', postId: 100 },
        ],
      };
      const query = new GetPostByIdQuery(mockPostId, mockUserId);

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockQueryPostRepository.findById.mockResolvedValue(
        postWithMultipleFiles as any,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.postFiles).toHaveLength(3);
      expect(result.postFiles?.[0].id).toBe(1);
      expect(result.postFiles?.[1].id).toBe(2);
      expect(result.postFiles?.[2].id).toBe(3);
    });

    it('should handle post with undefined files array', async () => {
      // Arrange
      const postWithUndefinedFiles = {
        id: 100,
        description: 'Test post',
        createdAt: new Date(),
        userId: mockUserId,
        files: undefined,
      };
      const query = new GetPostByIdQuery(mockPostId, mockUserId);

      mockExternalQueryUserRepository.findUserId.mockResolvedValue(mockUserId);
      mockQueryPostRepository.findById.mockResolvedValue(
        postWithUndefinedFiles as any,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.postFiles).toEqual([]);
    });

    it('should call user repository before post repository', async () => {
      // Arrange
      const query = new GetPostByIdQuery(mockPostId, mockUserId);

      const callOrder: string[] = [];

      mockExternalQueryUserRepository.findUserId.mockImplementation(() => {
        callOrder.push('user');
        return Promise.resolve(mockUserId);
      });

      mockQueryPostRepository.findById.mockImplementation(() => {
        callOrder.push('post');
        return Promise.resolve(mockPost as any);
      });

      // Act
      await handler.execute(query);

      // Assert
      expect(callOrder).toEqual(['user', 'post']);
    });
  });
});
