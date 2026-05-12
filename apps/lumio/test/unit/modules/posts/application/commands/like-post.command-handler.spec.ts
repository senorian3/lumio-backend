import { Test, TestingModule } from '@nestjs/testing';
import { PostRepository } from '@lumio/modules/posts/domain/infrastructure/post.repository';
import {
  LikePostCommandHandler,
  LikePostCommand,
} from '@lumio/modules/posts/application/commands/like-post.command-handler';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';

describe('LikePostCommandHandler', () => {
  let handler: LikePostCommandHandler;
  let mockPostRepository: jest.Mocked<PostRepository>;

  const mockUserId = 1;
  const mockPostId = 'post-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikePostCommandHandler,
        {
          provide: PostRepository,
          useValue: {
            findActivePostById: jest.fn(),
            updatePostLike: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<LikePostCommandHandler>(LikePostCommandHandler);
    mockPostRepository = module.get(PostRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully add like to post', async () => {
      // Arrange
      const command = new LikePostCommand(mockUserId, mockPostId, 'like');
      mockPostRepository.findActivePostById.mockResolvedValue({
        id: mockPostId,
        description: 'Test post',
        createdAt: new Date(),
        deletedAt: null,
        userId: 2,
        likeCount: 0,
        dislikeCount: 0,
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(mockPostRepository.findActivePostById).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockPostRepository.updatePostLike).toHaveBeenCalledWith(
        mockPostId,
        mockUserId,
        'like',
      );
    });

    it('should successfully add dislike to post', async () => {
      // Arrange
      const command = new LikePostCommand(mockUserId, mockPostId, 'dislike');
      mockPostRepository.findActivePostById.mockResolvedValue({
        id: mockPostId,
        description: 'Test post',
        createdAt: new Date(),
        deletedAt: null,
        userId: 2,
        likeCount: 0,
        dislikeCount: 0,
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(mockPostRepository.findActivePostById).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockPostRepository.updatePostLike).toHaveBeenCalledWith(
        mockPostId,
        mockUserId,
        'dislike',
      );
    });

    it('should successfully remove reaction (status = none)', async () => {
      // Arrange
      const command = new LikePostCommand(mockUserId, mockPostId, 'none');
      mockPostRepository.findActivePostById.mockResolvedValue({
        id: mockPostId,
        description: 'Test post',
        createdAt: new Date(),
        deletedAt: null,
        userId: 2,
        likeCount: 0,
        dislikeCount: 0,
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(mockPostRepository.findActivePostById).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockPostRepository.updatePostLike).toHaveBeenCalledWith(
        mockPostId,
        mockUserId,
        'none',
      );
    });

    it('should throw NotFoundDomainException when post does not exist', async () => {
      // Arrange
      const command = new LikePostCommand(mockUserId, mockPostId, 'like');
      mockPostRepository.findActivePostById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundDomainException,
      );
      expect(mockPostRepository.findActivePostById).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockPostRepository.updatePostLike).not.toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when status is invalid', async () => {
      // Arrange
      const command = new LikePostCommand(
        mockUserId,
        mockPostId,
        'invalid' as any,
      );
      mockPostRepository.findActivePostById.mockResolvedValue({
        id: mockPostId,
        description: 'Test post',
        createdAt: new Date(),
        deletedAt: null,
        userId: 2,
        likeCount: 0,
        dislikeCount: 0,
      });

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
      expect(mockPostRepository.findActivePostById).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockPostRepository.updatePostLike).not.toHaveBeenCalled();
    });

    it('should handle database error when finding post', async () => {
      // Arrange
      const command = new LikePostCommand(mockUserId, mockPostId, 'like');
      const dbError = new Error('Database connection failed');
      mockPostRepository.findActivePostById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
      expect(mockPostRepository.findActivePostById).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockPostRepository.updatePostLike).not.toHaveBeenCalled();
    });

    it('should handle database error when updating like', async () => {
      // Arrange
      const command = new LikePostCommand(mockUserId, mockPostId, 'like');
      mockPostRepository.findActivePostById.mockResolvedValue({
        id: mockPostId,
        description: 'Test post',
        createdAt: new Date(),
        deletedAt: null,
        userId: 2,
        likeCount: 0,
        dislikeCount: 0,
      });
      const dbError = new Error('Database update failed');
      mockPostRepository.updatePostLike.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
      expect(mockPostRepository.findActivePostById).toHaveBeenCalledWith(
        mockPostId,
      );
      expect(mockPostRepository.updatePostLike).toHaveBeenCalledWith(
        mockPostId,
        mockUserId,
        'like',
      );
    });
  });
});
